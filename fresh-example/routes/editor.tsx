import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import EditorIsland from "../islands/EditorIsland.tsx";

export default define.page(function EditorPage() {
  return (
    <div class="min-h-screen bg-gray-50">
      <Head>
        <title>HENDRIKS-RTE Editor</title>
      </Head>
      <EditorIsland />
    </div>
  );
});

