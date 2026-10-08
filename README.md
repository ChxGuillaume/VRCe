<p align="center">
    <a href="#">
    	<img src="public/icons/vrce-logo-256_x_256.png" height="156">
    </a>
</p>

# 🤗 VRCe - Manage your VRChat experience.

Simple extension to visualize and manage your VRChat experience.

Friends, Worlds, Events, Gallery, Moderation (Blocked/Muted Users)

# 🔗 Available on Webstores
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/vrc-e/
- Chrome: https://chrome.google.com/webstore/detail/vrce-manage-your-vrchat-e/ifehdekkdpiljkefhbhabpngnjdhloia

# ▶️ How to run

Requires Node.js 20.19+ (or 22.12+). First you need to install dependencies `npm ci`

The extension is a Manifest V3 extension written in TypeScript, built with Vite, Vue 3 and Nuxt UI 4 (Tailwind CSS 4).

## 🔎 Checks

- `npm run typecheck` type checks the project (`npm run build` does it too)
- `npm run lint` lints it

## 🧬 VRChat API types

The VRChat API types in `src/types/vrchat-api.generated.d.ts` are generated from the [vrchat.community](https://vrchat.community) OpenAPI specification.
To update them, bump the specification version in the `generate:api-types` script of `package.json` and run `npm run generate:api-types`.

## 💻 Run developement

Run `npm run serve`

Then load the `dist` folder once as an unpacked extension: https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked

The extension is rebuilt on every change and reloads itself: UI changes reload the open extension pages, background or manifest changes reload the whole extension (which closes the popup and extension tabs).

Auto reload talks to a local server on port `35729`, set `VRCE_DEV_RELOAD_PORT` to use another one. Production builds (`npm run build`) don't include it.

## 📦 Run build

Run `npm run build`

Then the extension is built into the `dist` folder, zip its content to publish it.

# 🧾 License

Distributed under the GPL-3.0 License. See [LICENSE](LICENSE.md) for more information.

# 📑 Changelog

My version are arbitrary versioned here [CHANGELOG.md](CHANGELOG.md), it only exists cause of the Webstores needing verification before publishing.

You can also find them here: https://addons.mozilla.org/en-US/firefox/addon/vrc-e/versions/
