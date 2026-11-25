import type { DropZoneAccept } from "@elea/ds";

/** Ouvre un sélecteur de fichiers (document ou appareil photo) et renvoie la promesse des fichiers. */
export function pickFiles(opts: { accept: DropZoneAccept[]; multiple?: boolean; capture?: boolean }): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = opts.multiple ?? true;
    input.accept = opts.accept
      .flatMap((a) => (a === "pdf" ? [".pdf", "application/pdf"] : [".jpg", ".jpeg", ".png", ".webp", "image/*"]))
      .join(",");
    if (opts.capture) input.setAttribute("capture", "environment");
    input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", () => {
      const files = input.files ? [...input.files] : [];
      input.remove();
      resolve(files);
    });
    input.addEventListener("cancel", () => {
      input.remove();
      resolve([]);
    });
    input.click();
  });
}
