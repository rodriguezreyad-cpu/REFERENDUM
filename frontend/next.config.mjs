/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer, webpack }) => {
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false,
      crypto: false,
      stream: false,
      http: false,
      https: false,
      zlib: false,
      path: false,
      os: false,
    };
    
    // Fix MetaMask SDK / RainbowKit react-native dependency issue
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };
    
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    // Suppress circular dependency warnings from relayer-sdk
    config.ignoreWarnings = [
      { module: /node_modules\/@zama-fhe\/relayer-sdk/ },
      { message: /Circular dependency/ },
    ];
    
    // Define global for browser
    if (!isServer) {
      config.plugins.push(
        new webpack.DefinePlugin({
          "global": "globalThis",
        })
      );
    }
    
    return config;
  },
};

export default nextConfig;
