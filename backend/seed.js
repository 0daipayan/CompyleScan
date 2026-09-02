// import mongoose from 'mongoose';
// import dotenv from 'dotenv';
// import User from './models/User.js';
// import Case from './models/Case.js';

// dotenv.config();

// async function seed() {
//   await mongoose.connect(process.env.MONGO_URI);
  
//   await User.deleteMany({});
//   await Case.deleteMany({});

//   const user = await User.create({
//     name: "Officer Rajesh Kumar",
//     email: "rajesh.kumar@lmpc.gov.in",
//     passwordHash: "hashedpassword123",
//     role: "inspector",
//     officerId: "LM-2026-0417"
//   });

//   await Case.create({
//     caseId: "LM-A17F",
//     productName: "Premium Wheat Flour 5kg",
//     category: "Packaged Food",
//     company: "AEC Consumer Goods Pvt Ltd",
//     createdBy: user._id,
//     images: [],
//     extractedFields: {
//       mrp: { value: 240, unit: "INR", confidence: 0.95 },
//       netQuantity: { value: 5, unit: "kg", confidence: 0.91 },
//       manufacturer: { value: "AEC Consumer Goods Pvt Ltd", confidence: 0.88 },
//       countryOfOrigin: { value: "India", confidence: 0.82 },
//       mfgDate: { value: "08/2026", confidence: 0.85 },
//       consumerCare: { value: "care@aecgoods.in", confidence: 0.90 }
//     },
//     ruleResults: [
//       { ruleId: "mrp_present", ruleName: "MRP Declaration", status: "PASS", message: "MRP clearly declared" },
//       { ruleId: "net_qty_present", ruleName: "Net Quantity Metric Standard", status: "PASS", message: "Net quantity in standard metric units" }
//     ],
//     overallStatus: "PASS",
//     score: 95
//   });

//   console.log("Database seeded successfully!");
//   process.exit(0);
// }

// seed();




import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Case from './models/Case.js';

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    await User.deleteMany({});
    await Case.deleteMany({});

    const user = await User.create({
      name: "Officer Rajesh Kumar",
      email: "rajesh.kumar@lmpc.gov.in",
      passwordHash: "hashedpassword123",
      role: "inspector",
      officerId: "LM-2026-0417"
    });

    await Case.create({
      caseId: "LM-A17F",
      productName: "boAt Airdopes 131",
      category: "Electronics & Appliances",
      company: "Califonix Tech & Manufacturing Pvt. Ltd.",
      createdBy: user._id,
      images: [],
      location: "Kolkata, WB",
      extractedFields: {
        product_name: { value: "boAt Airdopes 131", confidence: 0.79 },
        manufacturer: { value: "Califonix Tech & Manufacturing Pvt. Ltd.", confidence: 0.79 },
        country_of_origin: { value: "India", confidence: 0.79 },
        net_quantity: { value: 1, unit: "unit", confidence: 0.79 },
        manufacture_date: { value: "April 2024", confidence: 0.79 },
        best_before: { value: null, confidence: 0 },
        mrp: { value: 2990, unit: "INR", confidence: 0.79 },
        consumer_care: { value: "2269181920", confidence: 0.79 },
        unit_sale_price: { value: null, unit: null, confidence: 0 }
      },
      ruleResults: [
        { ruleId: "mrp_present", ruleName: "MRP Declaration", status: "PASS", message: "MRP declared: INR 2990" },
        { ruleId: "net_qty_present", ruleName: "Net Quantity Standard", status: "PASS", message: "Net Quantity declared: 1 unit" },
        { ruleId: "mfg_date_present", ruleName: "Date of Manufacture / Packing", status: "PASS", message: "Mfg Date declared: April 2024" },
        { ruleId: "consumer_care_present", ruleName: "Consumer Care Contact Details", status: "PASS", message: "Consumer Care details found: 2269181920" },
        { ruleId: "country_of_origin_present", ruleName: "Country of Origin", status: "PASS", message: "Country of Origin declared: India" }
      ],
      overallStatus: "PASS",
      score: 100,
      faults: []
    });

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();