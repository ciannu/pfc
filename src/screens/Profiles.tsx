import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  DocumentData,
  doc,
} from "firebase/firestore";

import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { FIREBASE_APP } from "../../FirebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

type RootStackParamList = {
  Profiles: { newProfileCreated?: boolean };
};

type ProfileData = {
  id: string;
  name: string;
  surname: string;
  userId: string; // Agregamos userId al tipo ProfileData
};

// manejar perfiles del usuario
const Profiles = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "Profiles">>();
  const [userProfiles, setUserProfiles] = useState<ProfileData[]>([]); // Cambiamos DocumentData por ProfileData
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth(FIREBASE_APP);
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        console.log("Usuario autenticado:", user);
        console.log("userId:", user.uid);
        setUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserProfiles = useCallback(async () => {
    try {
      if (!userId) return;
      const q = query(
        collection(getFirestore(FIREBASE_APP), "profiles"),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      const profilesData: ProfileData[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        surname: doc.data().surname,
        userId: doc.data().userId,
      }));
      setUserProfiles(profilesData);
    } catch (error) {
      console.error("Error obteniendo perfiles.", error);
    }
  }, [userId]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      const newProfileCreated = route.params?.newProfileCreated;
      if (newProfileCreated) {
        fetchUserProfiles();
      }
    });

    return unsubscribe;
  }, [navigation, route.params?.newProfileCreated]);

  useEffect(() => {
    fetchUserProfiles();
  }, [fetchUserProfiles]);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if (userId) {
          setUserId(userId);
          fetchUserProfiles();
        }
      } catch (error) {
        console.error("Error retrieving user ID from AsyncStorage:", error);
      }
    };

    fetchUserId();
  }, []);
  const handleDeleteProfile = async (profileId: string) => {
    Alert.alert(
      "Confirmar",
      "¿Estás seguro de que quieres borrar este perfil?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Aceptar",
          onPress: async () => {
            try {
              await deleteDoc(
                doc(getFirestore(FIREBASE_APP), "profiles", profileId)
              );

              setUserProfiles((prevProfiles) =>
                prevProfiles.filter((profile) => profile.id !== profileId)
              );
              Alert.alert("Éxito", "Perfil borrado correctamente");
            } catch (error) {
              console.error("Error borrando el perfil", error);
              Alert.alert("Error", "Hubo un problema borrando el perfil");
            }
          },
        },
      ]
    );
  };

  const handleProfileNavigation = (profileName: string) => {
    (navigation as any).navigate("Home", { profileName });
  };

  const navigateToCreateProfile = () => {
    (navigation as any).navigate("CreateProfile");
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      {userProfiles.map((profile: ProfileData) => (
        <View key={profile.id} style={styles.profileContainer}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => handleProfileNavigation(profile.name)}
          >
            <Text style={styles.profileButtonText}>
              {profile.name} {profile.surname}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteProfile(profile.id)}
          >
            <Image
              source={require("../../assets/delete_icon.png")}
              style={styles.deleteIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity
        style={styles.createProfileButton}
        onPress={navigateToCreateProfile}
      >
        <Text style={[styles.createProfileButtonText, styles.customFont]}>
          Crear nuevo perfil
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e0ffff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
  },
  backIcon: {
    width: 30,
    height: 30,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  profileButton: {
    backgroundColor: "#ffffff",
    padding: 10,
    borderRadius: 8,
    width: 200,
    alignItems: "center",
  },
  profileButtonText: {
    color: "#008080",
    fontWeight: "bold",
  },
  deleteButton: {
    marginLeft: 10,
  },
  deleteIcon: {
    width: 20,
    height: 20,
  },
  createProfileButton: {
    backgroundColor: "#008080",
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  createProfileButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  customFont: {
    fontFamily: "Tweety",
  },
});

export default Profiles;
