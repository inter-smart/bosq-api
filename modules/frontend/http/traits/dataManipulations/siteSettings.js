const { generateImageUrl } = require("../../../traits/imageUrlHelper");
const { singleMediaWithoutType } = require("../mediaButtonHelper")

function buildHeaderSection(cms){
  return {
    primary_media: singleMediaWithoutType(cms, "header_logo_media_path", "header_media_alt", "header_media_alt_ar"),
    secondary_media: singleMediaWithoutType(cms, "footer_logo_media_path", "footer_media_alt", "footer_media_alt_ar")
  }
}

function buildFooterSection(cms) {
  return {
    media: singleMediaWithoutType(
      cms,
      "footer_logo_media_path",
      "footer_media_alt",
      "footer_media_alt_ar"
    ),

    sale_enquiry: {
      title: cms?.sale_enquiry_title,
      title_ar: cms?.sale_enquiry_title_ar,
      phone: cms?.sales_phone_number,
      email: cms?.sale_enquiry_email,
    },

    support_enquiry: {
      title: cms?.support_enquiry_title,
      title_ar: cms?.support_enquiry_title_ar,
      phone: cms?.phone_number,
      email: cms?.support_email,
    },

    newsletter: {
      title: cms?.news_letter_title,
      title_ar: cms?.news_letter_title_ar,
    },

    address_block: {
      address: cms?.address,
      address_ar: cms?.address_ar,
      po_box_number: cms?.po_box_number,
    },
  };
}


function buildFooterIcons(links){
  return links.map(link => ({
    media: singleMediaWithoutType(link, "icon_media_path", "icon_alt", "icon_alt_ar"),
    ...(link?.link ? { link: link.link } : {}),
    
  }))
}




function buildNavigationData(products, projects) {
  let idCounter = 1;

  const homeItem = {
    id: idCounter++,
    hasSubmenu: false,
    name: "Home",
    name_ar: "الرئيسية",
    slug: "/",
  };

  const productItems = products.map((category) => {
    const children = category.children || [];
    const hasChildren = children.length > 0;

    return {
      id: category.id,
      hasSubmenu: hasChildren,
      name: category.name,
      name_ar: category.name_ar,
      slug: `/products?category=${category.slug}`,
      image: generateImageUrl(category.media_path),
      ...(hasChildren
        ? {
            items: children.map((child) => ({
              id: child.id,
              hasSubmenu: false,
              name: child.name,
              name_ar: child.name_ar,
              slug: `/products?subcategory=${child.slug}`,
              image: generateImageUrl(child.media_path),
            })),
          }
        : {}),
    };
  });

  const productsMenu = {
    id: idCounter++,
    hasSubmenu: true,
    name: "Products",
    name_ar: "المنتجات",
    slug: "/products",
    items: productItems,
  };

  const projectItems = projects.map((project) => ({
    id: project.id,
    hasSubmenu: false,
    name: project.title,
    name_ar: project.title_ar,
    slug: `/projects?subcategory=${project.slug}`,
    image: generateImageUrl(project.thumbnail),
  }));

  const projectsMenu = {
    id: idCounter++,
    hasSubmenu: projectItems.length > 0,
    name: "Projects",
    name_ar: "المشاريع",
    slug: "/projects",
    ...(projectItems.length > 0 ? { items: projectItems } : {}),
  };

  const aboutItem = {
    id: idCounter++,
    hasSubmenu: false,
    name: "About Us",
    name_ar: "من نحن",
    slug: "/about",
  };

  const contactItem = {
    id: idCounter++,
    hasSubmenu: false,
    name: "Contact Us",
    name_ar: "اتصل بنا",
    slug: "/contact",
  };

  return [homeItem, productsMenu, projectsMenu, aboutItem, contactItem];
}

module.exports = {
  buildHeaderSection,
  buildFooterSection,
  buildFooterIcons,
  buildNavigationData,
}