import { Authenticator } from "remix-auth";
import { GoogleStrategy } from "remix-auth-google";
import { sessionStorage } from "../session.server";
import shopify from "../shopify.server";

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
        const email = profile.emails[0].value;
        const nameData = profile.name || { givenName: profile.displayName, familyName: "" };

        try {
            // Use the custom domain from env or a default for your testing
            const shop = process.env.SHOP_CUSTOM_DOMAIN || "soni-147327.myshopify.com";
            const { admin } = await shopify.unauthenticated.admin(shop);

            // Check if customer exists
            const response = await admin.graphql(
                `#graphql
                query findCustomer($query: String!) {
                  customers(first: 1, query: $query) {
                    edges {
                      node {
                        id
                      }
                    }
                  }
                }`,
                { variables: { query: `email:${email}` } }
            );

            const result = await response.json();
            const existingCustomer = result.data?.customers?.edges?.[0];

            if (!existingCustomer) {
                // Create new customer
                await admin.graphql(
                    `#graphql
                    mutation customerCreate($input: CustomerInput!) {
                      customerCreate(input: $input) {
                        customer { id }
                        userErrors { field message }
                      }
                    }`,
                    {
                        variables: {
                            input: {
                                email,
                                firstName: nameData.givenName,
                                lastName: nameData.familyName,
                                note: "Created via Google Login App",
                            },
                        },
                    }
                );
            }
        } catch (err) {
            console.error("Failed to sync Shopify customer:", err);
        }

        return {
            id: profile.id,
            email,
            name: profile.displayName,
            accessToken,
        };
    }
);

authenticator.use(googleStrategy);
