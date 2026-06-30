// "use server";

// import { db } from "@/lib/prisma";
// import { auth } from "@clerk/nextjs/server";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// export async function generateCoverLetter(data) {
//   const { userId } = await auth();
//   if (!userId) throw new Error("Unauthorized");

//   const user = await db.user.findUnique({
//     where: { clerkUserId: userId },
//   });

//   if (!user) throw new Error("User not found");

//   const prompt = `
//     Write a professional cover letter for a ${data.jobTitle} position at ${
//     data.companyName
//   }.
    
//     About the candidate:
//     - Industry: ${user.industry}
//     - Years of Experience: ${user.experience}
//     - Skills: ${user.skills?.join(", ")}
//     - Professional Background: ${user.bio}
    
//     Job Description:
//     ${data.jobDescription}
    
//     Requirements:
//     1. Use a professional, enthusiastic tone
//     2. Highlight relevant skills and experience
//     3. Show understanding of the company's needs
//     4. Keep it concise (max 400 words)
//     5. Use proper business letter formatting in markdown
//     6. Include specific examples of achievements
//     7. Relate candidate's background to job requirements
    
//     Format the letter in markdown.
//   `;

//   try {
//     const result = await model.generateContent(prompt);
//     const content = result.response.text().trim();

//     const coverLetter = await db.coverLetter.create({
//       data: {
//         content,
//         jobDescription: data.jobDescription,
//         companyName: data.companyName,
//         jobTitle: data.jobTitle,
//         status: "completed",
//         userId: user.id,
//       },
//     });

//     return coverLetter;
//   } catch (error) {
//     console.error("Error generating cover letter:", error.message);
//     throw new Error("Failed to generate cover letter");
//   }
// }

// export async function getCoverLetters() {
//   const { userId } = await auth();
//   if (!userId) throw new Error("Unauthorized");

//   const user = await db.user.findUnique({
//     where: { clerkUserId: userId },
//   });

//   if (!user) throw new Error("User not found");

//   return await db.coverLetter.findMany({
//     where: {
//       userId: user.id,
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//   });
// }

// export async function getCoverLetter(id) {
//   const { userId } = await auth();
//   if (!userId) throw new Error("Unauthorized");

//   const user = await db.user.findUnique({
//     where: { clerkUserId: userId },
//   });

//   if (!user) throw new Error("User not found");

//   return await db.coverLetter.findUnique({
//     where: {
//       id,
//       userId: user.id,
//     },
//   });
// }

// export async function deleteCoverLetter(id) {
//   const { userId } = await auth();
//   if (!userId) throw new Error("Unauthorized");

//   const user = await db.user.findUnique({
//     where: { clerkUserId: userId },
//   });

//   if (!user) throw new Error("User not found");

//   return await db.coverLetter.delete({
//     where: {
//       id,
//       userId: user.id,
//     },
//   });
// }









"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateCoverLetter(data) {
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

  const prompt = `
You are an expert career coach and professional cover letter writer.

Write a professional cover letter for the following job.

Candidate Information:
- Industry: ${user.industry}
- Experience: ${user.experience} years
- Skills: ${user.skills?.join(", ") || "Not provided"}
- Professional Background: ${user.bio || "Not provided"}

Job Details:
Company: ${data.companyName}
Position: ${data.jobTitle}

Job Description:
${data.jobDescription}

Requirements:
- Professional and enthusiastic tone.
- Maximum 400 words.
- Highlight relevant experience.
- Mention measurable achievements whenever possible.
- Align candidate skills with job requirements.
- Use proper business letter formatting.
- Return ONLY the cover letter in Markdown.
`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1200,
      messages: [
        {
          role: "system",
          content:
            "You are an expert recruiter and resume writer who creates high-quality ATS-friendly cover letters.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content =
      completion.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("No response received from Groq");
    }

    const coverLetter = await db.coverLetter.create({
      data: {
        content,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        jobDescription: data.jobDescription,
        status: "completed",
        userId: user.id,
      },
    });

    return coverLetter;
  } catch (error) {
    console.error("Groq Error:", error);
    throw new Error("Failed to generate cover letter");
  }
}

export async function getCoverLetters() {
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

  return await db.coverLetter.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getCoverLetter(id) {
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

  return await db.coverLetter.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });
}

export async function deleteCoverLetter(id) {
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

  return await db.coverLetter.delete({
    where: {
      id,
      userId: user.id,
    },
  });
}