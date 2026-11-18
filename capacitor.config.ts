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
    url: "https://jole-wu.github.io/iNews/",
  },
  plugins: {},
};

export default config;
