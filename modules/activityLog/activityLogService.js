// SSE client registry + activity hook registration

const sseClients = new Map();
let clientIdCounter = 0;

function addClient(res) {
  const id = ++clientIdCounter;
  sseClients.set(id, res);
  return id;
}

function removeClient(id) {
  sseClients.delete(id);
}

// Maps a DB row to the Activity shape expected by the frontend
function formatActivity(log) {
  const typeMap = {
    blog: "blog",
    news: "blog",
    order: "user",
    user: "user",
    project: "system",
    system: "system",
  };

  return {
    id: String(log.id),
    type: typeMap[log.source_type] ?? "system",
    title: log.title,
    description: log.description || "",
    user: log.actor,
    timestamp: log.createdAt,
    status: log.status || undefined,
  };
}

// Pushes a new activity to all connected SSE clients
function broadcast(activityLog) {
  if (sseClients.size === 0) return;
  const payload = JSON.stringify(formatActivity(activityLog));
  sseClients.forEach((res) => {
    res.write(`data: ${payload}\n\n`);
  });
}

// Called once from server.js after models are loaded
function registerActivityHooks(models) {
  const { Blogs, News, Orders, Users, Projects, ActivityLog } = models;

  async function log(data) {
    try {
      const entry = await ActivityLog.create(data);
      broadcast(entry);
    } catch (err) {
      console.error("[ActivityLog] Failed to create log entry:", err.message);
    }
  }

  // BLOGS — status is BOOLEAN (true = published, false = draft)
  Blogs.addHook("afterCreate", "al_blog_create", async (blog) => {
    await log({
      source_type: "blog",
      title: "Blog Post Created",
      description: blog.title || "Untitled",
      entity_id: blog.id,
      status: blog.status ? "published" : "draft",
    });
  });

  Blogs.addHook("afterUpdate", "al_blog_update", async (blog) => {
    if (blog.changed("status") || blog.changed("title")) {
      await log({
        source_type: "blog",
        title: "Blog Post Updated",
        description: blog.title || "Untitled",
        entity_id: blog.id,
        status: blog.status ? "published" : "draft",
      });
    }
  });

  // NEWS — status is BOOLEAN (true = published, false = draft)
  News.addHook("afterCreate", "al_news_create", async (news) => {
    await log({
      source_type: "news",
      title: "News Article Created",
      description: news.title || "Untitled",
      entity_id: news.id,
      status: news.status ? "published" : "draft",
    });
  });

  News.addHook("afterUpdate", "al_news_update", async (news) => {
    if (news.changed("status") || news.changed("title")) {
      await log({
        source_type: "news",
        title: "News Article Updated",
        description: news.title || "Untitled",
        entity_id: news.id,
        status: news.status ? "published" : "draft",
      });
    }
  });

  // ORDERS — status is ENUM string (pending/confirmed/packed/shipped/delivered/cancelled/returned)
  Orders.addHook("afterCreate", "al_order_create", async (order) => {
    await log({
      source_type: "order",
      title: "New Order Placed",
      description: `Order #${order.order_id}`,
      entity_id: order.id,
      status: "pending",
    });
  });

  Orders.addHook("afterUpdate", "al_order_update", async (order) => {
    if (order.changed("status")) {
      await log({
        source_type: "order",
        title: "Order Status Updated",
        description: `Order #${order.order_id} → ${order.status}`,
        entity_id: order.id,
        status: order.status,
      });
    }
  });

  // USERS — timestamps: false, uses created_at/first_name/last_name/email
  Users.addHook("afterCreate", "al_user_create", async (user) => {
    const name =
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.email ||
      "Unknown";
    await log({
      source_type: "user",
      title: "New User Registered",
      description: name,
      entity_id: Number(user.id),
      actor: "System",
      status: "active",
    });
  });

  // PROJECTS — status is BOOLEAN (true = active, false = draft)
  Projects.addHook("afterCreate", "al_project_create", async (project) => {
    await log({
      source_type: "project",
      title: "Project Created",
      description: project.title || "Untitled",
      entity_id: project.id,
      status: project.status ? "active" : "draft",
    });
  });

  Projects.addHook("afterUpdate", "al_project_update", async (project) => {
    if (project.changed("status") || project.changed("title")) {
      await log({
        source_type: "project",
        title: "Project Updated",
        description: project.title || "Untitled",
        entity_id: project.id,
        status: project.status ? "active" : "draft",
      });
    }
  });
}

module.exports = { addClient, removeClient, broadcast, formatActivity, registerActivityHooks };
