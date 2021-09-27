import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/vue-demo/login',
    method: 'post',
    data
  })
}

export function getInfo(token) {
  return request({
    url: '/vue-demo/user/info',
    method: 'get',
    params: { token }
  })
}

export function getMenuList() {
  return request({
    url: '/vue-demo/permission/manageList',
    method: 'get'
  })
}

export function logout() {
  return request({
    url: '/vue-admin-template/user/logout',
    method: 'post'
  })
}
