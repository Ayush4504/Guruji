import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ 
    id: "guruji" , 
    name:"guruji",
    crendentials:{
        groq: {
            apikey: process.env.GROQ_API_KEY
        },
    }
});