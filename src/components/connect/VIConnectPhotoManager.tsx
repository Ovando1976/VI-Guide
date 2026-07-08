import { ImagePlus, Star, Trash2, UploadCloud } from "lucide-react";

type VIConnectPhotoManagerProps = {
  photos: string[];
  primaryPhotoUrl?: string;
  onChange: (next: { photos: string[]; primaryPhotoUrl: string }) => void;
  maxPhotos?: number;
};

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image."));
    };

    img.src = url;
  });
}

async function resizeImageFile(file: File): Promise<string> {
  const img = await loadImageFromFile(file);
  const maxSize = 1400;

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare image.");

  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.84);
}

export default function VIConnectPhotoManager({
  photos,
  primaryPhotoUrl,
  onChange,
  maxPhotos = 6,
}: VIConnectPhotoManagerProps) {
  const cleanPhotos = photos.filter(Boolean);
  const primary = primaryPhotoUrl || cleanPhotos[0] || "";

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    const resized = await Promise.all(
      imageFiles.slice(0, maxPhotos).map((file) => resizeImageFile(file))
    );

    const merged = Array.from(new Set([...cleanPhotos, ...resized])).slice(
      0,
      maxPhotos
    );

    onChange({
      photos: merged,
      primaryPhotoUrl: primary || merged[0] || "",
    });
  }

  function removePhoto(url: string) {
    const next = cleanPhotos.filter((photo) => photo !== url);
    onChange({
      photos: next,
      primaryPhotoUrl: primary === url ? next[0] || "" : primary,
    });
  }

  function makePrimary(url: string) {
    onChange({
      photos: cleanPhotos,
      primaryPhotoUrl: url,
    });
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
            Profile photos
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Add photos that show your real vibe.
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-300">
            Choose a main photo for your profile card. For this MVP, photos are stored
            locally in the browser. Firebase Storage comes next.
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 text-sm font-black text-slate-950 shadow-xl shadow-cyan-500/20 active:scale-95">
          <UploadCloud className="h-5 w-5" />
          Add photos
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>
      </div>

      {cleanPhotos.length ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/60">
            <div className="relative aspect-[4/5] min-h-[360px]">
              <img
                src={primary}
                alt="Main VI Connect profile preview"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/10" />
              <div className="absolute bottom-4 left-4 rounded-full bg-cyan-300 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-950">
                Main profile photo
              </div>
            </div>
          </div>

          <div className="grid content-start gap-3 sm:grid-cols-2">
            {cleanPhotos.map((photo, index) => {
              const isPrimary = photo === primary;

              return (
                <div
                  key={`${photo.slice(0, 40)}-${index}`}
                  className={`overflow-hidden rounded-2xl border bg-slate-950/60 ${
                    isPrimary ? "border-cyan-200/50" : "border-white/10"
                  }`}
                >
                  <div className="relative aspect-square">
                    <img
                      src={photo}
                      alt={`VI Connect uploaded photo ${index + 1}`}
                      className="absolute inset-0 h-full w-full object-cover"
                    />

                    {isPrimary ? (
                      <div className="absolute left-2 top-2 rounded-full bg-cyan-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-950">
                        Main
                      </div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => makePrimary(photo)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-3 text-xs font-black text-white hover:bg-white/10"
                    >
                      <Star className="h-4 w-4" />
                      Main
                    </button>

                    <button
                      type="button"
                      onClick={() => removePhoto(photo)}
                      className="inline-flex items-center justify-center gap-2 border-l border-white/10 px-3 py-3 text-xs font-black text-red-100 hover:bg-red-400/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}

            {cleanPhotos.length < maxPhotos ? (
              <label className="grid aspect-square cursor-pointer place-items-center rounded-2xl border border-dashed border-white/20 bg-white/[0.04] text-center active:scale-95">
                <span>
                  <ImagePlus className="mx-auto h-8 w-8 text-cyan-100" />
                  <span className="mt-3 block text-sm font-black text-white">
                    Add another
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-slate-400">
                    {cleanPhotos.length}/{maxPhotos}
                  </span>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => handleFiles(event.target.files)}
                />
              </label>
            ) : null}
          </div>
        </div>
      ) : (
        <label className="mt-5 grid cursor-pointer place-items-center rounded-[2rem] border border-dashed border-cyan-200/25 bg-cyan-300/5 p-10 text-center active:scale-[0.99]">
          <ImagePlus className="h-12 w-12 text-cyan-100" />
          <span className="mt-4 block text-lg font-black text-white">
            Upload your first profile photo
          </span>
          <span className="mt-2 block max-w-md text-sm font-semibold leading-6 text-slate-300">
            A strong main photo makes the profile card feel real and helps people
            understand who they are meeting.
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />
        </label>
      )}
    </section>
  );
}
