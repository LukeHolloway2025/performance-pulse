import axios from "axios";

const WP_API_URL = "https://rohrmanacademy.com";

const authService = {
  //@ts-ignore
  login: async (username, password) => {
    const response = await axios.post(
      `${WP_API_URL}/wp-json/jwt-auth/v1/token`,
      {
        username,
        password,
      },
    );
    if (response.data.token) {
      localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("userProfile");
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  getUserProfile: async () => {
    const user = authService.getCurrentUser();
    if (!user?.token) {
      return null;
    }
    
    try {
      const response = await axios.get(
        `${WP_API_URL}/wp-json/wp/v2/users/me?context=edit`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      
      const wpUser = response.data;
      
      const profile = {
        email: wpUser.email || user.user_email,
        display_name: wpUser.name || user.user_display_name,
        id: wpUser.id || user.id || 0,
        roles: wpUser.roles || [],
        store: wpUser.store_name || '' // Changed this line to grab the newly exposed field
      };
      
      sessionStorage.setItem("userProfile", JSON.stringify(profile));
      return profile;
      
    } catch (error) {
      console.error("Error fetching WP user profile:", error);
      return {
        email: user.user_email,
        display_name: user.user_display_name,
        id: user.id || 0,
        roles: [],
        store: ''
      };
    }
  }
};

export default authService;