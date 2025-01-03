import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";
export const useAuthStore = create((set,get)=>({
    
    authUser:null,
    isSigningUp:false,
    isLoggingIn:false,
    isUpdatingProfile:false,
    isCheckingAuth:true,
    onlineUsers:[],
    socket:null,

    checkAuth: async ()=>{
        try{
            const res = await axiosInstance.get("auth/check");
                 set({authUser:res.data});
                 get().connectSocket();
        } catch(error){
            console.error("Error in CheckAuth:",error)
        } finally{
            set(
                {isCheckingAuth:false}
            )
        }
    },
    signup: async (data)=>{
        set({isSigningUp:true})
        try{
            const res = await axiosInstance.post("/auth/signup",data)
            set({authUser:res.data});
            get().connectSocket();
            toast.success("Account created successfully");
        }catch(error){
            const message = error.response?.data?.message || "An error occurred during signup";
            toast.error(message);
        } finally{
            set({isSigningUp:false})
        }
    },

    login: async (data)=>{
       try{ set({isLoggingIn:true});
        const res = await axiosInstance.post("/auth/login",data)
        set({authUser:res.data})
        toast.success("Logged in successfully");
        get().connectSocket();
    } catch(error){
        const message = error.response?.data?.message || "An error occurred during login";
      toast.error(message);

     } finally{
        set({isLoggingIn:false})
    }
},

logout: async ()=>{
    try{
        await axiosInstance.post("/auth/logout");
        set({authUser:null});
        get().disconnectSocket();
        toast.success("Logged out successfully")
    } catch(error){
        const message = error.response?.data?.message || "An error occurred during logout";
        toast.error(message);
    }
},
updateProfile: async (data)=>{
    set({isUpdatingProfile:true});
    try {
        const res = await axiosInstance.put("/auth/update-profile",data);
        set({authUser:res.data});
        toast.success("Profile update successfully");
        
    } catch (error) {
        console.error("Error in updateProfile:", error);
        const message = error.response?.data?.message || "An error occurred during profile update";
        toast.error(message);
    } finally{
        set({isUpdatingProfile:false});
    }
},
connectSocket: () => {
    const { authUser } = get();
    const existingSocket = get().socket;

    if (!authUser || existingSocket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
   

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
  },
disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },

}))