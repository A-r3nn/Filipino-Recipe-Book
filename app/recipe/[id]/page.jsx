import { Suspense } from "react";
import RecipeDetail from "@/components/RecipeDetail";

export default function RecipePage() {
  return (
    <Suspense fallback={<p style={{ padding: 20 }}>Loading...</p>}>
      <RecipeDetail />
    </Suspense>
  );
}
