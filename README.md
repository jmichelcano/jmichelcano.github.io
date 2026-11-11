# Jose Michel — portfolio site

A Jekyll site that GitHub Pages builds automatically. You write projects as
short text files; GitHub turns them into pages about a minute after you commit.
You never need to edit HTML.

```
_config.yml              ← your name, links, resume path, categories
_data/experience.yml     ← the Experience list on the home page
_projects/               ← one .md file per project  (THIS is where you work)
assets/projects/<name>/  ← photos/videos for that project
assets/resume.pdf        ← drop your resume here (same name)
templates/               ← copy-paste starter for a new project
tools/prep_media.py      ← shrinks photos, strips GPS, preps videos
_layouts, _includes, assets/css, assets/js  ← the design; leave alone unless you want changes
```

---

## 1. Put it online (one time, ~10 minutes)

1. On GitHub, create a **public** repository named exactly **`jmichelcano.github.io`**.
2. Push this folder to it:
   ```bash
   cd portfolio-site
   git init -b main
   git add .
   git commit -m "Initial portfolio site"
   git remote add origin https://github.com/jmichelcano/jmichelcano.github.io.git
   git push -u origin main
   ```
   (Or use GitHub Desktop: *Add existing repository* → *Publish*.)
3. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch **main**, folder **/ (root)** → Save.
4. Wait a minute, then open **https://jmichelcano.github.io**.
   The **Actions** tab shows each build; a red ✗ means a typo in a file, and clicking it shows which one.

## 2. Add a project

1. Copy `templates/project-template.md` into `_projects/` and rename it, e.g. `_projects/steel-gate.md`.
   The name becomes the web address: `/projects/steel-gate/`.
2. Process your photos into the matching folder (see section 4):
   ```bash
   python tools/prep_media.py steel-gate ~/Pictures/gate/*.jpg
   ```
3. Paste the `gallery:` block the script prints into your `.md` file, write the captions, fill in the rest.
4. Set `published: true`, commit, push. Done.

**Editing from the browser:** open any file on github.com → pencil icon → edit → *Commit changes*.
Photos can be added with *Add file → Upload files* into `assets/projects/<name>/`
(run them through the script first so they're small and location-free).

## 3. Rules for the `.md` files

The part between the two `---` lines is settings. Watch these:

- Keep the two-space indents under `gallery:` and `highlights:` exactly as in the template.
- If a value contains a colon `:`, wrap it in quotes: `summary: "Result: it works"`.
- `featured: 1` puts a project first on the home page. Delete the line to un-feature it.
- `status: in-progress` shows the orange *In progress* badge.
- `published: false` hides a project completely. Four drafts are waiting for photos:
  flight sim cockpit, wingbox optimizer, DBF payload, camera battery door.

Below the second `---` is the write-up. `## Heading`, `- bullet`, `**bold**` is all you need.

## 4. Photo & video script

One-time setup: `pip install pillow pillow-heif` (and [ffmpeg](https://ffmpeg.org/download.html) for videos).

```bash
python tools/prep_media.py <project-name> photo1.jpg photo2.HEIC clip.mov
python tools/prep_media.py q50-engine-swap pickup.mov --trim 0-45   # keep seconds 0–45
python tools/prep_media.py lunar-mushroom-galley talk.mp4 --keep-audio
```

It resizes photos to 1600 px, **removes GPS location and all other metadata**,
converts video to small 720p MP4 (sound off unless `--keep-audio`), and makes a poster frame.
Always use it. Phone photos straight off the camera are 3–8 MB and carry your location.

## 5. Custom domain (when you buy one)

1. Buy the domain (Cloudflare, Porkbun, or Namecheap are cheap and simple).
2. In your domain's DNS settings add:
   | Type  | Name | Value |
   |-------|------|-------|
   | A     | @    | 185.199.108.153 |
   | A     | @    | 185.199.109.153 |
   | A     | @    | 185.199.110.153 |
   | A     | @    | 185.199.111.153 |
   | CNAME | www  | jmichelcano.github.io |
3. Repo **Settings → Pages → Custom domain**: enter it, Save. Tick **Enforce HTTPS** once it allows (can take up to a day).
4. Change `url:` in `_config.yml` to the new address.

## 6. Optional extras in a project file

- `hero_style: drawing` — for an engineering drawing or CAD render on a white background. The site inverts it to light lines on dark so it matches the design (the wingbox page uses this).
- `loop: true` on a video — plays silently on repeat like a GIF. Good for short CAD animations.
- `featured: 1` — shows the project as a full-screen panel on the home page, in that order.

## 7. Interactive 3D models (like Alejandro's site)

Any project can have a rotatable 3D model. Visitors click **Load interactive 3D**, so it never slows the page down.

1. Export from Fusion: **File → Export → OBJ** (or FBX).
2. Convert to `.glb`: open it in [Blender](https://www.blender.org/) (free) → **File → Export → glTF 2.0**, format *glTF Binary (.glb)*. Or send me the file and I'll convert it.
3. Keep it under ~10 MB: in Blender, add a *Decimate* modifier if it's bigger.
4. Put it in `assets/projects/<name>/` and add `model: yourfile.glb` to the project file.

## 8. Before anything goes public

- Internship work: high-level descriptions only. No drawings, part numbers, customer aircraft details, or screenshots unless your employer approved it.
- Friends' businesses, other people's faces, license plates, house numbers: check before posting.
- Search every new file for `TODO` and `CONFIRM`.
