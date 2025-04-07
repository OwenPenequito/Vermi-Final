import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, ScrollView, Image, Pressable, ImageBackground } from "react-native";
import { Calendar } from "react-native-calendars";
import { Link } from "expo-router";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useSettings } from "@/SettingsContext";
import { db } from "@/firebaseConfig";
import { doc, onSnapshot } from "firebase/firestore";


const Index = () => {
  const { temperatureUnit, isDarkMode, gasUnit } = useSettings();
  const [selectedDate, setSelectedDate] = useState(null);

  const [temperature1, setTemperature] = useState("N/A");
  const [moisture1, setMoisture] = useState("N/A");
  const [gas, setGas] = useState("N/A");


  useEffect(() => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    const fetchData = (sensor, setData) =>
      onSnapshot(doc(db, "sensorData", sensor), (documentSnapshot) => {
        if (documentSnapshot.exists()) {
          let value = documentSnapshot.data().value || 0;

          // Convert the temperature to Fahrenheit if the unit is Fahrenheit
          if (sensor === "temperature1" && temperatureUnit === "Fahrenheit") {
            value = (value * 9) / 5 +32;
          }

          if (sensor === "gas" && gasUnit === "Percentage") {
            value = (value / 10000);
          }

          value = parseFloat(value.toFixed(2));

          setData(value);
        }
      });
  
    const unsubscribeTemp = fetchData("temperature1", setTemperature);
    const unsubscribeMoist = fetchData("moisture1", setMoisture);
    const unsubscribeGas = fetchData("gas", setGas);
  
    return () => {
      unsubscribeTemp();
      unsubscribeMoist();
      unsubscribeGas();
    };
  }, [temperatureUnit, gasUnit]);

  const getLevelIndicator = (value, type) => {
    if (typeof value !== "number") return <Text>Unknown</Text>;
  
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
  
    return levels[type].find(({ max }) => value <= max)?.label || "Unknown";
  };

  const sensors = [
    { 
      title: "Temperature", 
      icon: "thermometer.high", 
      unit: temperatureUnit === "Celsius" ? "°C" : "°F", 
      value: temperature1, 
      level: getLevelIndicator(temperature1, "temperature"),
      link: "/tempView" 
    },
    { 
      title: "Gas Level", 
      icon: "gauge.badge.plus", 
      unit: gasUnit || "PPM", 
      value: gas, 
      level: getLevelIndicator(gas, "gas"),
      link: "/gasView" 
    },
    { 
      title: "Moisture", 
      icon: "water.waves", 
      unit: "%",
      value: moisture1, 
      level: getLevelIndicator(moisture1, "moisture"),
      link: "/moistView" 
    },
  ];

  return (
    <ImageBackground 
    source={require("@/assets/images/Background.png")}
    style={[styles.background, isDarkMode ? styles.darkBackground : null]}>

    <ScrollView contentContainerStyle= {{ flexGrow: 1, paddingBottom: 60}} style={[styles.container, isDarkMode ? styles.darkContainer : null]}>
      <View style={[styles.header, isDarkMode ? styles.darkHeader : null]}>
        <Text style={styles.title}>Home</Text>
        <Link href="/settings" asChild>
          <Pressable style={styles.settingsButton}>
            <IconSymbol size={24} name="gear" color="#FFFFFF" />
          </Pressable>
        </Link>
      </View>

      <Image source={require("@/assets/images/Nightcrawler.png")} style={styles.imgStyle} />


      <View style={[styles.sectionContainer, isDarkMode ? styles.darksectionCont : null]}>
        <Text style={[styles.head, isDarkMode ? styles.darkHead : null]}>Current Date</Text>
        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={{ [selectedDate]: { selected: true, selectedColor: "#8B5E3B" } }}
          theme={{
            ...calendarTheme,
            ...(isDarkMode ? calendarDarkTheme : {}),
          }}
          style={styles.calendar}
        />

      </View>

      <View style={[styles.sectionContainer, isDarkMode ? styles.darksectionCont : null]}>
        <Text style={[styles.head, isDarkMode ? styles.darkHead : null]}>Environmental Parameters</Text>
        <View style={styles.rowContainer}>
        {sensors.map((sensor, index) => (

        <View key={index} style={styles.button}>
            <IconSymbol size={40} name={sensor.icon} color="#F5F5DC" />
            <View style={styles.sensorInfo}>
              <Text style={styles.buttonText}>{sensor.title}</Text>
              <Text style={styles.infoText}>
                {String(sensor.value)} {String(sensor.unit)}
              </Text>
              <Text style={styles.infoText}>
                Level: {String(sensor.level)}
              </Text>
            </View>
            
            <Link href={sensor.link} asChild>
              <Pressable style={styles.detailsButton}>
                <Text style={styles.infoText}>View</Text>
              </Pressable>
            </Link>
          </View>
        ))}
        </View>
      </View>
    </ScrollView>
    </ImageBackground>
  );
};

export default Index;

const calendarTheme = {
  calendarBackground: "#FFF8DC",
  selectedDayBackgroundColor: "#8B5E3B",
  selectedDayTextColor: "white",
  todayTextColor: "#FF4500",
  dayTextColor: "#333",
  arrowColor: "#8B5E3B",
  monthTextColor: "#8B5E3B",
};

const calendarDarkTheme = {
  calendarBackground: "#333333",
  selectedDayBackgroundColor: "#FFFFFF",
  selectedDayTextColor: "#333",
  todayTextColor: "#FF6347",
  dayTextColor: "#DDDDDD",
  arrowColor: "#8B5E3B",
  monthTextColor: "#FFFFFFF"
};

const styles = StyleSheet.create({
  darkContainer: { 
    backgroundColor: "transparent" 
  },
  settingsButton: { 
    position: "absolute", 
    right: 20, 
    top: 15 
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    backgroundColor: "#5D4037",
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    elevation: 8,
    paddingVertical: 10,
  },
  darkHeader: {
    backgroundColor: "#333333",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 8,
    paddingVertical: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
  },
  imgStyle: {
    width: "90%",
    height: 150,
    alignSelf: "center",
    marginVertical: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#8B5E3B",
  },
  sectionContainer: {
    backgroundColor: "#FFF8DC",
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 15,
    elevation: 3,
  },
  head: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#3E2723",
  },
  calendar: {
    borderRadius: 15,
    padding: 10,
    elevation: 3,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
  },
  button: {
    width: 150,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3E2723",
    padding: 15,
    margin: 5,
    elevation: 4,
  },
  buttonText: {
    color: "#F5F5DC",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 5,
  },
  infoText: {
    fontSize: 14,
    textAlign: "center",
    color: "#F5F5DC",
  },
  progBar: {
    alignSelf: "center",
    marginVertical: 20,
  },
  darksectionCont: {
    backgroundColor: "#333333",
    borderRadius: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 15,
    elevation: 3,
  },
  darkHead: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#FFFFFF",
  },
  detailsButton: {
    backgroundColor: "#775e56",
    padding: 5,
    borderRadius: 10
  },
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    backgroundColor: '#F1F8E9'
  },
  darkBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    backgroundColor: '#1E1E1E'
  }  
  
});
