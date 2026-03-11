import { login } from "@/api/auth"

const useAuthStore = create((set) => ({
  token: "",
  refresh: "",
  isLogin: false,

  loginAction: async (data) => {
    const res = await login(data)

    const access = res.data.access
    const refresh = res.data.refresh

    localStorage.setItem("access_token", access)
    localStorage.setItem("refresh_token", refresh)

    set({
      token: access,
      refresh: refresh,
      isLogin: true
    })
  }
}))