import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, ImageBackground, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { db } from "@/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";
import { useSettings } from "@/SettingsContext";

const screenWidth = Dimensions.get("window").width;

const Stat = () => {
  const { isDarkMode, temperatureUnit, gasUnit } = useSettings();

  const [sensorData, setSensorData] = useState({
    temperature1: [],
    temperature2: [],
    moisture1: [],
    moisture2: [],
    moisture3: [],
    moisture4: [],
    gas: [],
  });

  console.log("📊 Chart Data:", JSON.stringify(sensorData, null, 2));

  const convertGas = (value) => {
    if (gasUnit === "Percentage") {
      return parseFloat((value / 10000).toFixed(2));
    }
    return value;  
  }

  useEffect(() => {
    const sensors = Object.keys(sensorData);
  
    const unsubscribes = sensors.map((sensor) =>
      onSnapshot(doc(db, "sensorData", sensor), (documentSnapshot) => {
        if (documentSnapshot.exists()) {
          const newValue = documentSnapshot.data().value || 0;
          console.log(`New Firestore Data for ${sensor}:`, newValue);
        
          setSensorData((prevData) => {
            const prevValues = [...(prevData[sensor] || [])]; 
            const newEntry = { value: newValue, index: prevValues.length > 0 ? prevValues[prevValues.length - 1].index + 1 : 0 };
            const updatedValues = [...prevValues.slice(-19), newEntry];
          
            return { ...prevData, [sensor]: [...updatedValues] }; 
          });
          
        } else {
          console.warn(`⚠️ No data found for sensor: ${sensor}`);
        }
      })
    );
  
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, []);
  
  
  useEffect(() => {
    console.log("✅ Updated Sensor Data:", JSON.stringify(sensorData, null, 2));
  }, [sensorData]);
  

  const getLatestReading = (dataKeys, convertFn) => {
    return dataKeys
    .map((key) => {
      const latestValue = sensorData[key].length > 0 ? sensorData[key][sensorData[key].length - 1].value : "N/A";
      if (latestValue === "N/A") return "N/A";
      const convertedValue = convertFn(latestValue);
      return parseFloat(convertedValue.toFixed(2));
    })
    .join(" | ");
  }

  const convertTemperature = (value) => {
   const convertedValue = temperatureUnit === "Fahrenheit" ? (value * 9) / 5 + 32 : value;
    return parseFloat(convertedValue.toFixed(2));
  }

  const getLevelIndicator = (dataKeys, type) => {
    const values = dataKeys.map((key) => sensorData[key].length > 0 ? parseFloat(sensorData[key][sensorData[key].length - 1].value.toFixed(2)) : 0);

    const levels = {
      temperature: [
        { max: 15, label: "Low" },
        { max: 25, label: "Normal" },
        { max: Infinity, label: "High" },
      ],
      moisture: [
        { max: 75, label: "Dry" },
        { max: 86, label: "Optimal" },
        { max: Infinity, label: "Wet" },
      ],
      gas: [
        { max: 800, label: "Safe" },
        { max: 1000, label: "Moderate" },
        { max: Infinity, label: "Hazardous" },
      ],
    };

    return values.map((value) => levels[type].find(({ max }) => value <= max)?.label || "Unknown").join(" | ");
  };
  

  const dynamicStyles = getStyles(isDarkMode);

  const sensors = [
    {
      label: "🌡️ Temperature",
      dataKeys: ["temperature1", "temperature2"],
      unit: temperatureUnit === "Fahrenheit" ? "°F" : "°C",
      convertFn: convertTemperature,
      colors: ["rgba(229, 115, 115, 1)", "rgba(255, 138, 101, 1)"],
      type: "temperature"
    },
    {
      label: "💧 Moisture",
      dataKeys: ["moisture1", "moisture2", "moisture3", "moisture4"],
      unit: "%",
      convertFn: (v) => v,
      colors: ["rgba(76, 175, 80, 1)", "rgba(129, 199, 132, 1)", "rgba(56, 142, 60, 1)", "rgba(102, 187, 106, 1)"],
      type: "moisture"
    },
    {
      label: "🛢️ Gas",
      dataKeys: ["gas"],
      unit: gasUnit || "PPM",
      convertFn: convertGas,
      colors:  ["rgba(255, 193, 7, 1)"],
      type: "gas"
    },
  ];

  return (
    <ImageBackground 
      source={require("@/assets/images/Background.png")}
      style={[dynamicStyles.background, isDarkMode ? dynamicStyles.darkBackground : null]}>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }} style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.title}>Statistics</Text>
        </View>

        { sensors.map((sensor, i) => (
          <View key={i} style={dynamicStyles.sectionContainer}>
            <Text style={dynamicStyles.head}>{sensor.label} Level</Text>
    
            <ScrollView horizontal style={dynamicStyles.chartContainer}>
              {sensorData[sensor.dataKeys[0]]?.length > 0 ? (
                <LineChart
                data = {{
                  labels:sensorData[sensor.dataKeys[0]].map ((_, index) => index.toString()),
                  datasets: sensor.dataKeys
                    .filter((key) => Array.isArray(sensorData[key]))
                    .map((key, index) => ({
                      data: sensorData[key].map((d) => sensor.convertFn(d.value)), 
                      color: (opacity = 1) => sensor.colors[index], 
                      strokeWidth: 2, 
                    })),
                }}
                width={Math.max(screenWidth, sensorData[sensor.dataKeys[0]].length * 30)}
                height={220}
                yAxisLabel=""
                chartConfig = {{
                  backgroundGradientFrom: "#FFF",
                  backgroundGradientTo: "#FFF",
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0,0,0, ${opacity})`,
                }}
                bezier
                 />
              ) : (
                <Text style={{ textAlign: "center", color: "#999" }}>No data available</Text>
              )}
            </ScrollView>

            

            <View style={dynamicStyles.textContainer}>
              <Text style={dynamicStyles.label}>Current Reading:{"\n"}</Text>
              <Text style={dynamicStyles.value}>
                {String(getLatestReading(sensor.dataKeys, sensor.convertFn))} {sensor.unit}
              </Text>
            </View>

            <View style={dynamicStyles.textContainer}>
              <Text style={dynamicStyles.label}>Level Indicator:</Text>
              <Text style={dynamicStyles.level}>
                {getLevelIndicator(sensor.dataKeys, sensor.type)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </ImageBackground>
  );
};

export default Stat;



const getStyles = (isDarkMode) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "transparent",
    },
    title: {
      color: isDarkMode ? "#FFFFFF" : "#FFFFFF",
      fontSize: 34,
      fontWeight: "bold",
      textAlign: "center",
    },
    header: {
      backgroundColor: isDarkMode ? "#333333" : "#5D4037",
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      elevation: 8,
      paddingVertical: 20,
    },
    imgStyle: {
      marginTop: 15,
      width: "90%",
      height: 150,
      alignSelf: "center",
      borderRadius: 15,
    },
    head: {
      fontSize: 22,
      fontWeight: "bold",
      textAlign: "center",
      marginVertical: 15,
      color: isDarkMode ? "#DDDDDD" : "#3E2723",
    },
    sectionContainer: {
      backgroundColor: isDarkMode ? "#2E2E2E" : "#FFF3E0",
      borderRadius: 15,
      padding: 20,
      marginHorizontal: 20,
      marginVertical: 12,
      elevation: 5,
    },
    textContainer: {
      flexWrap: "wrap",
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      marginVertical: 5,
    },
    label: {
      fontSize: 16,
      fontWeight: "bold",
      color: isDarkMode ? "#BBBBBB" : "#5D4037",
      flexShrink: 1
    },
    value: {
      fontSize: 16,
      color: isDarkMode ? "#FFFFFF" : "#3E2723",
      flex: 1,
      textAlign: "right"
    },
    level: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#D84315",
      flexWrap: "wrap",
      textAlign: "right",
      maxWidth: "90%"
    },

    background: {
      flex: 1,
      width: "100%",
      height: "100%",
      resizeMode: "cover",
      backgroundColor: '#F1F8E9',
    },
    darkBackground: {
      flex: 1,
      width: "100%",
      height: "100%",
      resizeMode: "cover",
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
      elevation: 3,
    },
    
  });
