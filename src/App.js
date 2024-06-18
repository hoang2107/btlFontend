import React, { Fragment, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import DefaultCompoent from './components/DefaultCompoent/DefaultCompoent'
import { routes } from './routes'
import { isJsonString } from './utils'
import * as UserService from './services/UserService'
import { resetUser, updateUser } from "./redux/slides/userSlide"
import { useDispatch, useSelector } from 'react-redux'
import { jwtDecode } from 'jwt-decode';
import Loading from './components/LoadingCompoent/Loading'



function App() {
  const dispatch = useDispatch();
  const [isPending, setIsPending] = useState(false)
  const user = useSelector((state) => state.user)

  // useEffect(() => {
  //   setIsPending(true)
  //   const { storageData, decoded } = handleDecoded()
  //   if (decoded?.id) {
  //     handleGetDetailsUser(decoded?.id, storageData)
  //   }
  //   setIsPending(false)
  // }, [])

  useEffect(() => {
    const initUserDetails = async () => {
      setIsPending(true)
      const { storageData, decoded } = handleDecoded()
      if (decoded?.id) {
        await handleGetDetailsUser(decoded?.id, storageData)
      }
      setIsPending(false)
    }
    initUserDetails()
  }, [])


  const handleDecoded = () => {
    let storageData = localStorage.getItem('access_token')
    let decoded = {}
    if (storageData && isJsonString(storageData)) {
      storageData = JSON.parse(storageData)
      decoded = jwtDecode(storageData)
    }
    return { decoded, storageData }
  }

  UserService.axiosJWT.interceptors.request.use(async (config) => {
    const currentTime = new Date()
    const { decoded } = handleDecoded()
    let storageRefreshToken = localStorage.getItem('refresh_token')
    const refreshToken = JSON.parse(storageRefreshToken)
    const decodeRefreshToken = jwtDecode(refreshToken)
    if (decoded?.exp < currentTime.getTime() / 1000) {
      if (decodeRefreshToken?.exp > currentTime.getTime() / 1000) {
        const data = await UserService.refreshToken()
        config.headers['token'] = `Bearer ${data?.access_token}`
      } else {
        dispatch(resetUser())
      }
    }
    return config;
  }, (err) => {
    return Promise.reject(err);
  });

  // const handleGetDetailsUser = async (id, token) => {
  //   const res = await UserService.getDetailsUser(id, token)
  //   dispatch(updateUser({ ...res?.data, access_token: token }))
  // }
  const handleGetDetailsUser = async (id, token) => {
    try {
      let storageRefreshToken = localStorage.getItem('refresh_token')
      const refreshToken = JSON.parse(storageRefreshToken)
      const res = await UserService.getDetailsUser(id, token)
      dispatch(updateUser({ ...res?.data, access_token: token, refreshToken: refreshToken }))
    } catch (error) {
      console.error("Failed to fetch user details: ", error)
    }
  }

  return (
    <div>
      <Loading isPending={isPending}>
        <Router>
          <Routes>
            {routes.map((route) => {
              const Page = route.page
              //const ischeckAuth = !route.isPrivate || user.isAdmin
              const Layout = route.isShowHeader ? DefaultCompoent : Fragment
              return (
                <Route key={route.path} path={route.path} element={
                  <Layout>
                    <Page />
                  </Layout>
                } />
              )

            })}
          </Routes>
        </Router>
      </Loading>
    </div>
  )
}
export default App