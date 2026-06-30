// import { inngest } from "./client";

// export const helloWorld = inngest.createFunction(
//   { id: "hello-world" },
//   { event: "test/hello.world" },
//   async ({ event, step }) => {
//     await step.sleep("wait-a-moment", "1s");
//     return { message: `Hello ${event.data.email}!` };
//   },
// );


// import { db } from "@/lib/prisma";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// export const generateIndustryInsights = inngest.createFunction(
//   { name: "Generate Industry Insights" },
//   { cron: "0 0 * * 0" }, // Run every Sunday at midnight
//   async ({ event, step }) => {
//     const industries = await step.run("Fetch industries", async () => {
//       return await db.industryInsight.findMany({
//         select: { industry: true },
//       });
//     });

//     for (const { industry } of industries) {
//       const prompt = `
//           Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
//           {
//             "salaryRanges": [
//               { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
//             ],
//             "growthRate": number,
//             "demandLevel": "High" | "Medium" | "Low",
//             "topSkills": ["skill1", "skill2"],
//             "marketOutlook": "Positive" | "Neutral" | "Negative",
//             "keyTrends": ["trend1", "trend2"],
//             "recommendedSkills": ["skill1", "skill2"]
//           }
          
//           IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
//           Include at least 5 common roles for salary ranges.
//           Growth rate should be a percentage.
//           Include at least 5 skills and trends.
//         `;

//       const res = await step.ai.wrap(
//         "gemini",
//         async (p) => {
//           return await model.generateContent(p);
//         },
//         prompt
//       );

//       const text = res.response.candidates[0].content.parts[0].text || "";
//       const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

//       const insights = JSON.parse(cleanedText);

//       await step.run(`Update ${industry} insights`, async () => {
//         await db.industryInsight.update({
//           where: { industry },
//           data: {
//             ...insights,
//             lastUpdated: new Date(),
//             nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
//           },
//         });
//       });
//     }
//   }
// );


import { inngest } from "./client";
import { db } from "@/lib/prisma";
import Groq from "groq-sdk";

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Weekly background job to refresh industry insights for all tracked industries.
 * Runs every Sunday at midnight.
 */
export const generateIndustryInsights = inngest.createFunction(
  { name: "Generate Industry Insights", id: "generate-industry-insights" },
  { cron: "0 0 * * 0" }, // Weekly on Sundays
  async ({ step }) => {
    // 1. Fetch all unique industries currently in our database
    const industries = await step.run("Fetch industries", async () => {
      return await db.industryInsight.findMany({
        select: { industry: true },
      });
    });

    if (industries.length === 0) return { message: "No industries to update" };

    // 2. Loop through each industry and update insights
    for (const { industry } of industries) {
      const prompt = `
        Analyze the current state of the ${industry} industry and provide insights in the following JSON format:
        {
          "salaryRanges": [
            { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
          ],
          "growthRate": number,
          "demandLevel": "High" | "Medium" | "Low",
          "topSkills": ["skill1", "skill2"],
          "marketOutlook": "Positive" | "Neutral" | "Negative",
          "keyTrends": ["trend1", "trend2"],
          "recommendedSkills": ["skill1", "skill2"]
        }
        
        Requirements:
        - Include at least 5 common roles for salary ranges.
        - Growth rate should be a percentage number.
        - Include at least 5 skills and trends.
      `;

      // Use step.ai.wrap to gain observability in the Inngest dashboard
      const result = await step.ai.wrap(
        "groq-completion",
        async (p) => {
          return await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: "You are a professional industry analyst. Return only valid JSON.",
              },
              { role: "user", content: p },
            ],
            response_format: { type: "json_object" },
          });
        },
        prompt
      );

      const content = result.choices[0].message.content;
      const insights = JSON.parse(content);

      // 3. Persist the updated insights back to Prisma db
      await step.run(`Update ${industry} insights`, async () => {
        await db.industryInsight.update({
          where: { industry },
          data: {
            ...insights,
            lastUpdated: new Date(),
            nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next Sunday
          },
        });
      });
    }

    return { updatedCount: industries.length };
  }
);