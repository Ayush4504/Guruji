// "use server";

// import { db } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { revalidatePath } from "next/cache";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// export async function saveResume(content) {
//   const { userId } = await auth();
//   if (!userId) throw new Error("Unauthorized");

//   const user = await db.user.findUnique({
//     where: { clerkUserId: userId },
//   });

//   if (!user) throw new Error("User not found");

//   try {
//     const resume = await db.resume.upsert({
//       where: {
//         userId: user.id,
//       },
//       update: {
//         content,
//       },
//       create: {
//         userId: user.id,
//         content,
//       },
//     });

//     revalidatePath("/resume");
//     return resume;
//   } catch (error) {
//     console.error("Error saving resume:", error);
//     throw new Error("Failed to save resume");
//   }
// }

// export async function getResume() {
//   const { userId } = await auth();
//   if (!userId) throw new Error("Unauthorized");

//   const user = await db.user.findUnique({
//     where: { clerkUserId: userId },
//   });

//   if (!user) throw new Error("User not found");

//   return await db.resume.findUnique({
//     where: {
//       userId: user.id,
//     },
//   });
// }

// export async function improveWithAI({ current, type }) {
//   const { userId } = await auth();
//   if (!userId) throw new Error("Unauthorized");

//   const user = await db.user.findUnique({
//     where: { clerkUserId: userId },
//     include: {
//       industryInsight: true,
//     },
//   });

//   if (!user) throw new Error("User not found");

//   const prompt = `
//     As an expert resume writer, improve the following ${type} description for a ${user.industry} professional.
//     Make it more impactful, quantifiable, and aligned with industry standards.
//     Current content: "${current}"

//     Requirements:
//     1. Use action verbs
//     2. Include metrics and results where possible
//     3. Highlight relevant technical skills
//     4. Keep it concise but detailed
//     5. Focus on achievements over responsibilities
//     6. Use industry-specific keywords
    
//     Format the response as a single paragraph without any additional text or explanations.
//   `;

//   try {
//     const result = await model.generateContent(prompt);
//     const response = result.response;
//     const improvedContent = response.text().trim();
//     return improvedContent;
//   } catch (error) {
//     console.error("Error improving content:", error);
//     throw new Error("Failed to improve content");
//   }
// }


"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import { revalidatePath } from "next/cache";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function saveResume(content) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  try {
    const resume = await db.resume.upsert({
      where: {
        userId: user.id,
      },
      update: {
        content,
      },
      create: {
        userId: user.id,
        content,
      },
    });

    revalidatePath("/resume");
    return resume;
  } catch (error) {
    console.error("Error saving resume:", error);
    throw new Error("Failed to save resume");
  }
}

export async function getResume() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return await db.resume.findUnique({
    where: {
      userId: user.id,
    },
  });
}

export async function improveWithAI({ current, type }) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
    include: {
      industryInsight: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const prompt = `
As an expert resume writer, improve the following ${type} description for a ${
    user.industry
  } professional.

Current content:
"${current}"

Requirements:
1. Use strong action verbs.
2. Include measurable achievements and metrics where possible.
3. Highlight relevant technical and professional skills.
4. Keep it concise and professional.
5. Focus on achievements rather than responsibilities.
6. Include industry-specific keywords.
7. Return only the improved content.

Industry Insights:
${
  user.industryInsight
    ? JSON.stringify(user.industryInsight)
    : "No additional insights available."
}
`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume writer who creates ATS-friendly, professional resume content.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const improvedContent =
      completion.choices?.[0]?.message?.content?.trim() || "";

    if (!improvedContent) {
      throw new Error("No content generated");
    }

    return improvedContent;
  } catch (error) {
    console.error("Error improving content:", error);
    throw new Error("Failed to improve content");
  }
}