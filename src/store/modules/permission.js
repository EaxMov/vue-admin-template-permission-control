import { asyncRoutes, constantRoutes } from '@/router'
import Layout from '@/layout'
import { getMenuList } from '@/api/user'

export const getViewComponent = (function() {
  const load = (path) => {
    try {
      return require(`@/views${path}`)
    } catch (err) {
      return null
    }
  }
  return function(componentPath) {
    /* paths 路径补全
     *  '' 含有.vue后缀的路径补全 | 例如：demo.vue = demo.vue
     *  '/index.vue'  指向文件夹下的/index.vue 文件路径补全 | 例如 /demo = /demo/index.vue
     *  js  含有.js后缀的路径补全 | 例如 /demo = /demo.js
     *  '.vue' 不包含.vue的路径补全 | 例如：/demo = /demo.vue
     */
    const paths = ['', '/index.vue', '.js', '.vue'].map((suffix) => componentPath + suffix)
    let component = null
    let path = ''

    while ((path = paths.shift())) {
      component = load(path)
      if (component) {
        return component.default || component
      }
    }
    // 前端项目中没有对应的文件时 转到开发中页面
    return getViewComponent('/errorPage/404.vue')
  }
})()

// 格式化路由组件
export const filterRoutes = (routeData) => {
  const newRouters = routeData.filter((data, index) => {
    // component 路由指向的文件
    if (data.component === 'Layout') { // Layout组件特殊处理
      data.component = Layout
    } else {
      data.component = getViewComponent(data.component)
    }
    data.meta = {
      title: data.name, // 标题
      icon: data.icon, // 图标
      activeIcon: data.activeIcon,
      keepAlive: data.keepAlive || true // 缓存
    }
    data.hidden = !data.visible // 是否隐藏
    data.name = data.routeName // 路由的name
    data.path = data.routePath // 路由的url
    if (data.children && data.children.length > 0) {
      data.redirect = data.children[0].routePath // 默认跳转到第一个子路由
      data.children = filterRoutes(data.children)
    }
    return true
  })

  return newRouters
}

const state = {
  routes: [],
  addRoutes: []
}

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  }
}

const actions = {
  async getAppMenu({ commit }, roles) { // roles为用户信息获取的角色，如果是路由表是全部返回，需要通过roles去过滤，否则不需要这个参数，通过传token后端直接返回改用户所拥有的路由
    const res = await getMenuList()
    const menu = (res || {}).data || []
    const deepCopy = JSON.parse(JSON.stringify(menu)) // 深拷贝数据
    const newRoute = filterRoutes(deepCopy) // 组件化 后台返回的菜单
    // const allRoute = constantRoutes.concat(newRoute) // 拼接公共路由
    const allRoute = newRoute // 拼接公共路由
    // 没有路由时的404页面 必须最后一个加 同时防止路由守卫判断进入死循环
    allRoute.push({
      path: '*',
      redirect: '/404',
      visible: false,
      hidden: true
    })
    commit('SET_ROUTES', allRoute)
    return allRoute
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
