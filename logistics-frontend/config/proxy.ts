/**
 * @name 代理的配置
 * @see 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */

// 获取环境变量中的后端地址或使用默认的localhost
const BACKEND_HOST = process.env.BACKEND_HOST || 'http://localhost:8101';

export default {
  // 本地开发环境代理配置
  dev: {
    '/api/': {
      // 后端服务地址
      target: BACKEND_HOST,
      // 配置跨域
      changeOrigin: true,
      // 不修改路径
      pathRewrite: { '^': '' },
    },
  },

  /**
   * @name 详细的代理配置
   * @doc https://github.com/chimurai/http-proxy-middleware
   */
  test: {
    // localhost:8000/api/** -> https://preview.pro.ant.design/api/**
    '/api/': {
      target: 'https://proapi.azurewebsites.net',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
  pre: {
    '/api/': {
      target: 'your pre url',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
};
