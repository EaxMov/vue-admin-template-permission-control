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

  if (hasToken) { // 判断是否有token
    if (to.path === '/login') { // 如果访问路由是登陆页，则直接跳转到登录页
      next({ path: '/' })
      NProgress.done()
    } else {
      // 默认模板是根据返回的角色去决定显示哪些菜单
      // const hasRoles = store.getters.roles && store.getters.roles.length > 0

      const hasRoutes = store.getters.permission_routes && store.getters.permission_routes.length > 0

      if (hasRoutes) { // 判断是否有从后台请求的菜单，如果有，则不每次都重新获取数据
        next() // 当有用户权限的时候，说明所有可访问路由已生成 如访问没权限的全面会自动进入404页面
      } else {
        try { // 如果没有权限
          // 登陆之后获取用户信息
          const { roles } = await store.dispatch('user/getInfo')

          // 登陆之后获取菜单列表
          const accessRoutes = await store.dispatch('permission/getAppMenu', roles)
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
    // 如果没有token

    if (whiteList.indexOf(to.path) !== -1) {
      // 是否在白名单里？【可以添加不需要校验的路由】
      next()
    } else {
      // 不在白名单？跳转到登陆页并且添加路由参数，登陆成功后会取redirect参数进行router.push
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})
