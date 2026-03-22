import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md border-destructive/20 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl">Access Forbidden</CardTitle>
          <CardDescription>
            You do not have permission to access this resource.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center pb-8">
          <Button asChild variant="default">
            <Link href="/">
              Return to Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
