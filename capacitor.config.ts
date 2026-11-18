import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.jolewinews.app",
  appName: "iNews",
  webDir: "docs",
  bundledWebRuntime: false,
  ios: {
    contentInset: "always",
    scheme: "iNews",
    // 关键：内容走远程，原生壳只做容器。
    // 远端页面更新后，用户下次打开 App 即拿到最新内容，无需重新出 IPA。
    // Capacitor 离线时会自动回退到打包进 App 的本地 docs/ 副本。
    // 需要换内容源时只改这一行 + 重新出一次包，或改成动态配置。
  },
  server: {
    // 内容源走 jsDelivr CDN（镜像本仓库 docs/ 目录）。
    // 改内容：只需 git push 到本仓库，CDN 自动同步，App 下次打开即最新，
    //         完全无需重新出 IPA。
    // jsDelivr 无需任何访问凭据，WebView 内相对路径资源可正常加载。
    // 离线或 CDN 不可达时，Capacitor 自动回退到打包进 App 的本地 docs/ 副本。
    url: "https://cdn.jsdelivr.net/gh/JOLE-WU/iNews@master/docs/",
  },
  plugins: {},
};

export default config;
