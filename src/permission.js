import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login'] // no redirect whitelist

router.beforeEach(async(to, from, next) => {
  // start progress bar
  NProgress.start()

  // set page title
  document.title = getPageTitle(to.meta.title)

  // determine whether the user has logged in
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      // if is logged in, redirect to the home page
      next({ path: '/' })
      NProgress.done()
    } else {
      // 判断是否有从后台请求的菜单，如果有，则不每次都重新获取数据
      const hasRoutes = store.getters.permission_routes && store.getters.permission_routes.length > 0
      if (hasRoutes) {
        next()
      } else {
        try {
          // 获取用户信息
          const { roles } = await store.dispatch('user/getInfo')

          // generate accessible routes map based on roles
          const accessRoutes = await store.dispatch('permission/getAppMenu', roles)
          console.log(accessRoutes)
          // 添加异步路由
          router.addRoutes(accessRoutes)

          // hack方法确保addRoutes完成
          // 动态添加的路由页面一刷新就凉凉了（空白），在地址栏输入其他动态添加的路由又是可以正常跳转的
          next({ ...to, replace: true })
        } catch (error) {
          // 删除token并重定向到登录页
          await store.dispatch('user/resetToken')
          console.log(error)
          Message.error(error.message || 'Has Error')
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    /* has no token*/

    if (whiteList.indexOf(to.path) !== -1) {
      // in the free login whitelist, go directly
      next()
    } else {
      // other pages that do not have permission to access are redirected to the login page.
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})
