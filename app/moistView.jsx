import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, ImageBackground, TouchableOpacity } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { db } from "@/firebaseConfig";
import { updateDoc, doc, onSnapshot, serverTimestamp, setDoc, collection, addDoc } from "firebase/firestore";
import { useSettings } from "@/SettingsContext";
import { useRouter } from "expo-router";

const Stat = () => {

  const router = useRouter();
  const { isDarkMode, moistureUnit } = useSettings();

  const [sensorData, setSensorData] = useState({
    moisture1: { data: [], status: false },
    moisture2: { data: [], status: false },
    moisture3: { data: [], status: false },
    moisture4: { data: [], status: false },
  });

  const [controlMod, setControlModules] = useState({
    Svalve1: { status: false }, 
    Svalve2: { status: false }, 
    Svalve3: { status: false }, 
    Svalve4: { status: false }, 
    Pump: { status: false }
  })

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

    const sensorUnsubscribes = ["moisture1", "moisture2", "moisture3", "moisture4"].map(fetchData);
    const controlUnsubscribes = ["Svalve1", "Svalve2", "Svalve3", "Svalve4", "Pump"].map(fetchControlModule);

    return () => {
      sensorUnsubscribes.forEach((unsubscribe) => unsubscribe());
      controlUnsubscribes.forEach((unsubscribe) => unsubscribe());
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

  const getLevelIndicator = (value) => {
    if (value <= 75) return <Text>Dry</Text>;
    if ( value > 75 && value <= 85) return <Text>Optimal</Text>;
    if (value > 85) return <Text>Wet</Text>;
  };

  const dynamicStyles = getStyles(isDarkMode);

  return (
    <ImageBackground 
      source={require("@/assets/images/Background.png")}
      style={[dynamicStyles.background, isDarkMode ? dynamicStyles.darkBackground : null]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }} style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.title}>Moisture Level</Text>
        </View>

        {Object.entries(sensorData).map(([sensor, { data }], i) => (
          <View key={i} style={dynamicStyles.sectionContainer}>
            <Text style={dynamicStyles.zoneLabel}>{`Zone ${i + 1}`}</Text>

            <ScrollView horizontal style={dynamicStyles.chartContainer}>
              <LineChart
                data={data.map((d, idx) => ({ value: d.value, index: idx }))}
                hideYAxisText={false}
                thickness={3}
                showGrid
                color={sensor === "moisture1" ? "#4CAF50" : sensor === "moisture2" ? "#81C784" : sensor === "moisture3" ? "#388E3C" : "#66BB6A"}
                width={Math.max(400, data.length * 30 || 400)}
                dataPointsColor={['#4CAF50', '#81C784', '#388E3C', '#66BB6A'][i]}
                isAnimated={false}
                spacing={40}
                hideDataPoints={false}
                adjustToWidth={true}
              />
            </ScrollView>

            <View style={dynamicStyles.textContainer}>
              <Text style={dynamicStyles.label}>Current Reading:</Text>
              <Text style={dynamicStyles.value}>{data.length > 0 ? data[data.length - 1].value : "N/A"} %</Text>
            </View>

            <View style={dynamicStyles.textContainer}>
              <Text style={dynamicStyles.label}>Level Indicator:</Text>
              <Text style={dynamicStyles.level}>{getLevelIndicator(data.length > 0 ? data[data.length - 1].value : 0)}</Text>
            </View>

            <View style={dynamicStyles.controlCont}>
              <Text style={dynamicStyles.controlModule}>{`VALVE ${i + 1}`}</Text>
              <TouchableOpacity 
                style={[dynamicStyles.sensorButton, controlMod[`Svalve${i + 1}`].status ? dynamicStyles.buttonOn : dynamicStyles.buttonOff]} 
                onPress={() => toggleControl(`Svalve${i + 1}`)}>
                <Text style={dynamicStyles.buttonText}>{controlMod[`Svalve${i + 1}`].status ? "Turn Off" : "Turn On"}</Text>
              </TouchableOpacity>

              <View style={dynamicStyles.statusIndicator}>
                <Text style={[dynamicStyles.statusText, controlMod[`Svalve${i + 1}`].status ? dynamicStyles.statusOn : dynamicStyles.statusOff]}>
                  {controlMod[`Svalve${i + 1}`].status ? "Valve is ON" : "Valve is OFF"}
                </Text>
              </View>
            </View>

            <Text style={dynamicStyles.label}>Historical Readings:</Text>
            <View style={dynamicStyles.historyContainer}>
              <ScrollView>
                {data.map((d, index) => (
                  <Text key={index} style={dynamicStyles.historyText}>
                    {index + 1}. {d.value} % - {d.timestamp.toLocaleString()}
                  </Text>
                ))}
              </ScrollView>
            </View>
          </View>
        ))}

        <View style={dynamicStyles.controlCont}>
          <Text style={dynamicStyles.controlModule}>Pump</Text>
          <TouchableOpacity
          style={[dynamicStyles.sensorButton, controlMod.Pump.status ? dynamicStyles.buttonOn : dynamicStyles.buttonOff]}
          onPress={() => toggleControl("Pump")}>
            <Text style={dynamicStyles.buttonText}>{controlMod.Pump.status ? "Turn Off" : "Turn On"}</Text>
          </TouchableOpacity>
          <View style={dynamicStyles.statusIndicator}>
            <Text style={[dynamicStyles.statusText, controlMod.Pump.status ? dynamicStyles.statusOn : dynamicStyles.statusOff]}>
              {controlMod.Pump.status ? "Sensor is ON" : "Sensor is OFF"}
            </Text>
          </View>
        </View>
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
