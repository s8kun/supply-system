import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LockKeyhole } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <LockKeyhole className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">Unauthorized Access</CardTitle>
          <CardDescription>
            Please sign in to continue to the application.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center pb-8">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/login">
              Sign In
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
