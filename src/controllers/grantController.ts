import { Request, Response, NextFunction } from "express";
import { Grant } from "../models/Grant";

// Seed data helper
const seedDefaultGrants = async () => {
  const count = await Grant.countDocuments();
  if (count === 0) {
    console.log("Seeding default grants into MongoDB...");
    const seedGrants = [
      {
        title: "Advanced Artificial Intelligence for Healthcare Equity",
        organization: "National Institutes of Health (NIH)",
        amount: 1500000,
        deadline: new Date("2026-11-15"),
        tags: ["AI", "Healthcare", "BioTech", "Equity"],
        description: "The purpose of this funding opportunity is to accelerate the development and application of artificial intelligence and machine learning tools to address healthcare disparities. We are looking for highly innovative, scalable SaaS or hardware solutions that can be rapidly deployed in underserved communities.",
        specifications: [
          { label: "Eligibility", value: "For-profit startups, non-profits, and academic institutions." },
          { label: "Technology Readiness", value: "TRL 4 - TRL 7 (Validation in laboratory or relevant environment)" },
          { label: "Matching Funds", value: "No matching funds required." },
          { label: "Submission Format", value: "SF424 (R&R) via Grants.gov" }
        ],
        reviews: [
          { author: "Dr. Amanda Chen", org: "MedTech Innovations", text: "We won this grant last year. The reporting requirements are rigorous but the program officers are incredibly supportive of deep tech.", rating: 5 },
          { author: "James Miller", org: "HealthAI Inc", text: "Highly competitive, but absolutely worth the effort. The funding allowed us to expand our clinical trials by 3x.", rating: 5 }
        ]
      },
      {
        title: "NSF Deep Tech Seed Fund",
        organization: "National Science Foundation (NSF)",
        amount: 500000,
        deadline: new Date("2026-12-01"),
        tags: ["AI", "SaaS", "Deep Tech"],
        description: "Supports the translation of deep tech and AI software innovations into commercial ventures. Projects should present significant commercial potential alongside substantial positive societal impacts.",
        specifications: [
          { label: "Eligibility", value: "US-based small businesses (SBA guidelines apply)." },
          { label: "Funder Focus", value: "AI, Hardware, Renewable Materials." }
        ],
        reviews: []
      },
      {
        title: "Gates Foundation: Global Health Initiative",
        organization: "Gates Foundation",
        amount: 2500000,
        deadline: new Date("2026-10-15"),
        tags: ["Global Health", "High Value", "Non-Profit"],
        description: "Funding deployment capability and testing of clinical innovations in Sub-Saharan Africa and developing regions.",
        specifications: [
          { label: "Eligibility", value: "NGOs, startups, international consortia." }
        ],
        reviews: []
      }
    ];

    // Generate extra grants for pagination demonstration
    for (let i = 0; i < 20; i++) {
      seedGrants.push({
        title: `Innovative Research Grant Program - Cohort ${2026 + (i % 2)} - Slot ${i + 1}`,
        organization: ["DOE", "EPA", "USDA", "NASA", "EU Horizon"][i % 5] || "Other Funder",
        amount: 100000 + (i * 75000),
        deadline: new Date(`2026-${String((i % 11) + 1).padStart(2, '0')}-28`),
        tags: [["AI", "SaaS"], ["Medical", "Research"], ["Green", "Hardware"], ["BioTech", "Data"], ["Climate", "SaaS"]][i % 5] || ["Research"],
        description: "This grant supports high-risk, high-reward research in emerging fields. We are looking for proposals that push the boundaries of current technology and offer significant societal benefits.",
        specifications: [
          { label: "Eligibility", value: "For-profit startups and academic research institutions." }
        ],
        reviews: []
      });
    }

    await Grant.insertMany(seedGrants);
    console.log("Seeding complete.");
  }
};

export const getGrants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await seedDefaultGrants();

    const search = req.query.search ? String(req.query.search) : "";
    const tag = req.query.tag ? String(req.query.tag) : "All";
    const sort = req.query.sort ? String(req.query.sort) : "deadline-asc";
    
    const page = req.query.page ? Math.max(1, parseInt(String(req.query.page), 10)) : 1;
    const limit = req.query.limit ? Math.max(1, parseInt(String(req.query.limit), 10)) : 8;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { organization: { $regex: search, $options: "i" } }
      ];
    }

    if (tag && tag !== "All") {
      query.tags = tag;
    }

    let sortQuery: any = {};
    if (sort === "amount-desc") {
      sortQuery = { amount: -1 };
    } else if (sort === "amount-asc") {
      sortQuery = { amount: 1 };
    } else if (sort === "deadline-asc") {
      sortQuery = { deadline: 1 };
    } else {
      sortQuery = { createdAt: -1 };
    }

    const totalGrants = await Grant.countDocuments(query);
    const grants = await Grant.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    res.json({
      grants,
      totalGrants,
      totalPages: Math.ceil(totalGrants / limit),
      currentPage: page
    });
  } catch (error) {
    next(error);
  }
};

export const getGrantById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const grant = await Grant.findById(req.params.id);
    if (!grant) {
      res.status(404);
      throw new Error("Grant opportunity not found");
    }
    res.json(grant);
  } catch (error) {
    next(error);
  }
};

export const createGrant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, organization, amount, deadline, tags, description, specifications, reviews } = req.body;
    const newGrant = await Grant.create({
      title,
      organization,
      amount,
      deadline,
      tags,
      description,
      specifications: specifications || [],
      reviews: reviews || []
    });
    res.status(201).json(newGrant);
  } catch (error) {
    next(error);
  }
};

export const deleteGrant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const grant = await Grant.findById(req.params.id);
    if (!grant) {
      res.status(404);
      throw new Error("Grant not found");
    }
    await grant.deleteOne();
    res.json({ message: "Grant opportunity removed" });
  } catch (error) {
    next(error);
  }
};
