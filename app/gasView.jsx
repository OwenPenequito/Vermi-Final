import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, ImageBackground, TouchableOpacity } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { db } from "@/firebaseConfig";
import { updateDoc, doc, onSnapshot, serverTimestamp, collection, addDoc } from "firebase/firestore";
import { useSettings } from "@/SettingsContext";
import { useRouter } from "expo-router";

const Stat = () => {

  const router = useRouter();
  const { isDarkMode, gasUnit, setGasUnit } = useSettings(); // assuming gasUnit is stored in context
  const [sensorData, setSensorData] = useState({
    gas: { data: [] },
  });

  const [controlMod, setControlModules] = useState({
    Efan: { status: false }
  });

  useEffect(() => {
    const fetchData = (sensor) => {
      const docRef = doc(db, "sensorData", sensor);
      return onSnapshot(docRef, async (documentSnapshot) => {
        if (documentSnapshot.exists()) {
          const { value = 0, timestamp } = documentSnapshot.data();
          
          // Save the new data to Firestore historical collection
          const historicalRef = collection(db, "sensorData", sensor, "historicalData");
          await addDoc(historicalRef, {
            value,
            timestamp: serverTimestamp(),
          });

          setSensorData((prev) => ({
            ...prev,
            [sensor]: {
              data: [...prev[sensor].data.slice(-19), { value, index: prev[sensor].data.length, timestamp: timestamp?.toDate() || new Date() }], // Store only last 20 records
            },
          }));
        }
      }, (error) => {
        console.error("Firestore sensor error:", error);
      });
    };

    const fetchControlModule = (module) => {
      const docRef = doc(db, "controlMod", module);
      return onSnapshot(docRef, (documentSnapshot) => {
        if (documentSnapshot.exists()) {
          setControlModules((prev) => ({
            ...prev,
            [module]: { status: documentSnapshot.data().status },
          }));
        }
      }, (error) => {
        console.error("Firestore control error: ", error);
      });
    };

    const sensorUnsubscribes = ["gas"].map(fetchData);
    const controlUnsubscribes = ["Efan"].map(fetchControlModule);

    return () => {
      sensorUnsubscribes.forEach((unsubscribe) => unsubscribe());
      controlUnsubscribes.forEach((unsubscribe) => unsubscribe);
    };
  }, []);

  const toggleControl = async (module) => {
    const moduleRef = doc(db, "controlMod", module);
    const newStatus = !controlMod[module].status;

    try {
      if (newStatus) {
        // If turning ON, also update the timestamp
        await updateDoc(moduleRef, {
          status: true,
          turnedOnTimestamp: serverTimestamp(),
        });
      } else {
        // If turning OFF, only update the status
        await updateDoc(moduleRef, {
          status: false,
        });
      }

      setControlModules((prev) => ({
        ...prev,
        [module]: { 
          status: newStatus,
          // Optionally, you could add turnedOnTimestamp here to state if needed
        },
      }));
    } catch (error) {
      console.error("Error updating control module status: ", error);
    }
  };

  const convertToPercentage = (value) => {
    return (value / 10000); // Assuming 10000 is the maximum value in ppm
  };

  const getLatestReading = (datasets) => {
    return datasets
      .map((data) => (data.length > 0 ? data[data.length - 1].value : "N/A"))
      .join(" | ");
  };

  const getLevelIndicator = (value) => {
    if (value <= 800) return <Text>Safe</Text>;
    if (value > 800 && value <= 1000) return <Text>Moderate</Text>;
    if (value > 1000) return <Text>"Hazardous"</Text>;
  };

  const dynamicStyles = getStyles(isDarkMode);

  return (
    <ImageBackground 
      source={require("@/assets/images/Background.png")}
      style={[dynamicStyles.background, isDarkMode ? dynamicStyles.darkBackground : null]}>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }} style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.title}>Gas Level</Text>
        </View>

        {Object.entries(sensorData).map(([sensor, { data }], i) => (
          <View key={i} style={dynamicStyles.sectionContainer}>
            <Text style={dynamicStyles.zoneLabel}>All Zones</Text>
            
            <ScrollView horizontal style={dynamicStyles.chartContainer}>
              <LineChart
                data={data.map((d, idx) => ({ value: d.value, index: idx }))}
                hideYAxisText={false}
                thickness={3}
                showGrid
                color={"#FFC107"}
                width={Math.max(400, data.length * 30 || 400)}
                dataPointsColor={"#FFC107"}
                isAnimated={false}
                spacing={40}
                hideDataPoints={false}
                adjustToWidth={true}
              />
            </ScrollView>

            <View style={dynamicStyles.textContainer}>
              <Text style={dynamicStyles.label}>Current Reading:</Text>
              <Text style={dynamicStyles.value}>
                {data.length > 0 ? (gasUnit === "ppm" 
                  ? data[data.length - 1].value.toFixed(2) 
                  : convertToPercentage(data[data.length - 1].value).toFixed(2)) 
                  : "N/A"} {gasUnit}
              </Text>
            </View>

            <View style={dynamicStyles.textContainer}>
              <Text style={dynamicStyles.label}>Level Indicator:</Text>
              <Text style={dynamicStyles.level}>
                {getLevelIndicator(data.length > 0 ? data[data.length - 1].value : 0)}
              </Text>
            </View>

            <View style={dynamicStyles.controlCont}>
              <Text style={dynamicStyles.controlModule}>Fan</Text>
              <TouchableOpacity 
                style={[dynamicStyles.sensorButton, controlMod.Efan.status ? dynamicStyles.buttonOn : dynamicStyles.buttonOff]} 
                onPress={() => toggleControl("Efan")}>
                <Text style={dynamicStyles.buttonText}>{controlMod.Efan.status ? "Turn Off" : "Turn On"}</Text>
              </TouchableOpacity>

              <View style={dynamicStyles.statusIndicator}>
                <Text style={[dynamicStyles.statusText, controlMod.Efan.status ? dynamicStyles.statusOn : dynamicStyles.statusOff]}>
                  {controlMod.Efan.status ? "Fan is ON" : "Fan is OFF"}
                </Text>
              </View>
            </View>

            <Text style={dynamicStyles.label}>Historical Readings:</Text>
            <View style={dynamicStyles.historyContainer}>
              <ScrollView>
                {data.map((d, index) => (
                  <Text key={index} style={dynamicStyles.historyText}>
                    {index + 1}. 
                    {gasUnit === "ppm" 
                      ? d.value.toFixed(2) 
                      : convertToPercentage(d.value).toFixed(2)} {gasUnit} - {d.timestamp.toLocaleString()}
                  </Text>
                ))}
              </ScrollView>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={dynamicStyles.footer}>
        <TouchableOpacity style={dynamicStyles.backButton} onPress={() => router.push("/")}> 
          <Text style={dynamicStyles.buttonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>

    </ImageBackground>
  );
};

export default Stat;

const getStyles = (isDarkMode) =>
  StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: "transparent" 
    },
    title: { 
      color: "#FFFFFF", 
      fontSize: 34, 
      fontWeight: "bold", 
      textAlign: "center" 
    },
    header: { 
      backgroundColor: isDarkMode ? "#333333" : "#5D4037", 
      borderBottomLeftRadius: 20, 
      borderBottomRightRadius: 20, 
      elevation: 8, 
      paddingVertical: 20 
    },
    sectionContainer: { 
      backgroundColor: isDarkMode ? "#2E2E2E" : "#FFF3E0", 
      borderRadius: 15, 
      padding: 20, 
      marginHorizontal: 20, 
      marginVertical: 12, 
      elevation: 5 
    },
    textContainer: { 
      flexDirection: "row", 
      justifyContent: "space-between", 
      marginVertical: 5 
    },
    label: { 
      fontSize: 16, 
      fontWeight: "bold", 
      color: isDarkMode ? "#BBBBBB" : "#5D4037" 
    },
    value: { 
      fontSize: 16, 
      color: isDarkMode ? "#FFFFFF" : "#3E2723" 
    },
    level: { 
      fontSize: 16, 
      fontWeight: "bold", 
      color: "#D84315" 
    },
    background: { 
      flex: 1, 
      width: "100%", 
      height: "100%", 
      resizeMode: "cover", 
      backgroundColor: '#F1F8E9' 
    },
    darkBackground: { 
      backgroundColor: '#1E1E1E' 
    },
    chartContainer: { 
      marginVertical: 10, 
      padding: 10, 
      borderRadius: 10, 
      backgroundColor: "#FFF", 
      shadowColor: "#000", 
      shadowOpacity: 0.1, 
      shadowRadius: 5, 
      elevation: 3 
    },
    sensorButton: { 
      paddingVertical: 12, 
      paddingHorizontal: 25, 
      borderRadius: 10, 
      alignItems: "center" 
    },
    buttonOn: { 
      backgroundColor: "#D84315" 
    },
    buttonOff: { 
      backgroundColor: "#4CAF50" 
    },
    buttonText: {
      color: "#F5F5DC",
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "center",
      marginTop: 5,
    },
    historyContainer: {
      maxHeight: 150,
      backgroundColor: isDarkMode ? "#424242" : "#FFCCBC",
      padding: 10,
      borderRadius: 10,
      marginVertical: 10,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowRadius: 5,
      elevation: 3,
    },
    historyText: {
      fontSize: 14,
      color: isDarkMode ? "#FFFFFF" : "#3E2723",
    },
    zoneLabel: {
      fontWeight: "bold",
      fontSize: 16
    },
    footer: {
      padding: 15,
      alignItems: "center",
      backgroundColor: isDarkMode ? "#333333" : "#5D4037", 
      elevation: 8,
      marginBottom: -5,
    },
    backButton: {
      backgroundColor: "#424242",
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 10,
      alignItems: "center",
    },
    statusIndicator: {
      marginTop: 10,
      alignItems: "center",
      padding: 5,
      borderRadius: 10,
      backgroundColor: "rgba(0,0,0,0.1)",
    },
    statusText: {
      fontSize: 14,
      fontWeight: "bold",
    },
    
    statusOn: {
      color: "#4CAF50",
    },
    
    statusOff: {
      color: "#D84315",
    },
    controlCont: {
      marginVertical: 5,
      padding: 15,
      backgroundColor: isDarkMode ? "#424242" : "#FFF3E0",
      borderRadius: 10,
    },
    controlTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDarkMode ? "#FFFFFF" : "#3E2723",
      textAlign: "center",
    },
    controlModule: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDarkMode ? "#FFFFFF" : "#3E2723",
    }
  });
