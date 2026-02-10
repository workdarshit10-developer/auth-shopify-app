import { Authenticator } from "remix-auth";
import { GoogleStrategy } from "remix-auth-google";
import { sessionStorage } from "../session.server";

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export interface User {
    id: string;
    email: string;
    name: string;
    accessToken: string;
}

export const authenticator = new Authenticator<User>(sessionStorage);

const googleStrategy = new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "YOUR_CLIENT_SECRET",
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback",
    },
    async ({ accessToken, refreshToken, extraParams, profile }) => {
        // Get the user data from your DB or API using the tokens and profile
        return {
            id: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            accessToken,
        };
    }
);

authenticator.use(googleStrategy);
