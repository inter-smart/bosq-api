// database/seeders/stateCountry.js
import slugify from "slugify";
import { Country as CSCCountry, State as CSCState } from "country-state-city";
import { sequelize, models } from "../models/index.js";


const Country = models.Country
const State = models.State
export async function seedCountriesAndStates() {

  // Debug: Check if models are loaded
  if (!Country || !State) {
    console.error("❌ Models not loaded properly!");
    console.log("Available models:", Object.keys(db));
    process.exit(1);
  }

  let transaction;

  try {
    // Ensure database connection
    await sequelize.authenticate();
    console.log("✅ Database connected");

    transaction = await sequelize.transaction();
    console.log("🔄 Starting seeding process...");

    const countries = CSCCountry.getAllCountries();
    console.log(`📊 Found ${countries.length} countries to seed`);

    let processedCountries = 0;
    let processedStates = 0;

    for (const country of countries) {
      // 1️⃣ Insert / fetch country
      const [countryRecord, created] = await Country.findOrCreate({
        where: {
          slug: country.isoCode.toLowerCase(),
        },
        defaults: {
          name: country.name,
          slug: country.isoCode.toLowerCase(),
          status: 1,
        },
        transaction,
      });

      if (created) {
        processedCountries++;
      }

      // 2️⃣ Fetch states for this country
      const states = CSCState.getStatesOfCountry(country.isoCode);
      if (!states || states.length === 0) continue;

      // 3️⃣ Prepare states payload
      const statePayload = states.map((state) => ({
        name: state.name,
        slug: slugify(state.name, { lower: true, strict: true }),
        country_id: countryRecord.id,
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // 4️⃣ Bulk insert states
      const insertedStates = await State.bulkCreate(statePayload, {
        ignoreDuplicates: true,
        transaction,
      });

      processedStates += insertedStates.length;
    }

    await transaction.commit();
    console.log("✅ Seeding completed successfully!");
    console.log(`   📍 Countries: ${processedCountries}`);
    console.log(`   📍 States: ${processedStates}`);
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

// Run directly if this file is executed
if (import.meta.url === `file://${process.argv[1]}`) {
  seedCountriesAndStates()
    .then(() => {
      console.log("🎉 Seeding script finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding script error:", error);
      process.exit(1);
    });
}