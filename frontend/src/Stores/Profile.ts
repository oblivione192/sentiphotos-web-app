
import { UserModel } from '../Objects/Models/UserModel';
import { devtools } from 'zustand/middleware'

import ProfileApi from '../Objects/Api/ProfileApi';
import { create } from 'zustand';
interface ProfileState {
    userId: string | null;
    username: string | null;
    email: string | null;
    createdAt: Date | null;
    masterKey: string | null;
    setProfile: (profile: UserModel) => void;
    setMasterKey: (key: string) => void;
    clearProfile: () => void;
    fetchProfile: () => Promise<void>;
}

const useProfile = create<ProfileState>()(
  devtools(
    (set) => ({
      userId: null,
      username: null,
      email: null,
      createdAt: null,
      masterKey: null,

      setProfile: (profile) =>
        set(
          {
            userId: profile.userId,
            username: profile.username,
            email: profile.email,
            createdAt: profile.createdAt,
          },
          false,
          'profile/setProfile'
        ),

      setMasterKey: (key) =>
        set(
          { masterKey: key },
          false,
          'profile/setMasterKey'
        ),

      clearProfile: () =>
        set(
          {
            userId: null,
            username: null,
            email: null,
            createdAt: null,
            masterKey: null,
          },
          false,
          'profile/clearProfile'
        ),

      fetchProfile: async () => {
        try {
          const profile = await ProfileApi.getProfile()
          set(
            {
              userId: profile.userId,
              username: profile.username,
              email: profile.email,
              createdAt: profile.createdAt,
            },
            false,
            'profile/fetchProfile/success'
          )
        } catch{
    
          set(
            {
              userId: null,
              username: null,
              email: null,
              createdAt: null,
              masterKey: null,
            },
            false,
            'profile/fetchProfile/error'
          )
        }
      },
    }),
    { name: 'profile-store' }
  )
)
export default useProfile;