import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticator } from "../../services/auth.server";
import { sessionStorage } from "../../session.server";

export const loader = ({ request }: LoaderFunctionArgs) => {
    return authenticator.authenticate("google", request, {
        successRedirect: "/",
        failureRedirect: "/auth/login",
    });
};
