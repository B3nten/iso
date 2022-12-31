import { useState } from "react";
import { useEffect } from "react";
import useAsset from "ultra/hooks/use-asset.js";
import { UltraAction } from "../actions/UltraAction.ts";

export const getUser = new UltraAction(
  async (ctx, { name }: { name: string }) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return ctx.response.json({ data: "Hello world! From " + name });
  },
);

export default function App() {
  const [message, setMessage] = useState<
    Awaited<ReturnType<typeof getUser.fetch>>
  >();
  useEffect(() => {
    async function getData() {
      const data = await getUser.fetch({ name: "benton" });
      setMessage(data);
    }
    getData();
  }, []);
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>basic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="shortcut icon" href={useAsset("/favicon.ico")} />
        <link rel="preload" as="style" href={useAsset("/style.css")} />
        <link rel="stylesheet" href={useAsset("/style.css")} />
      </head>
      <body>{message && <div>{message.data}</div>}</body>
    </html>
  );
}
