import React from "react";
import { StyleSheet, Text, View, ScrollView, Image, Switch, ImageBackground } from "react-native";
import { useSettings } from "@/SettingsContext";
import { Picker } from '@react-native-picker/picker';

const Settings = () => {
  const {
    isDarkMode,
    setIsDarkMode,
    temperatureUnit,
    setTemperatureUnit,
    gasUnit,
    setGasUnit,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useSettings();

  return (
    <ImageBackground style={[styles.background, isDarkMode && styles.darkBackground]}>
      <Image source={require("@/assets/images/Circle.png")} style={styles.lowerLeftImage} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, isDarkMode && styles.darkTitle]}>Settings</Text>
        </View>

        <Image source={require("@/assets/images/Arc.png")} style={styles.arcImage} />

        <View style={[styles.sectionContainer, isDarkMode && styles.darkSection]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>Data Formatting</Text>
          
          <Text style={[styles.label, isDarkMode && styles.darkLabel]}>Temperature Unit</Text>
          <Picker selectedValue={temperatureUnit} style={[styles.picker, isDarkMode && styles.darkPicker]} onValueChange={setTemperatureUnit}>
            <Picker.Item label="Celsius (°C)" value="Celsius" />
            <Picker.Item label="Fahrenheit (°F)" value="Fahrenheit" />
          </Picker>

          <Text style={[styles.label, isDarkMode && styles.darkLabel]}>Gas Unit</Text>
          <Picker selectedValue={gasUnit} style={[styles.picker, isDarkMode && styles.darkPicker]} onValueChange={setGasUnit}>
            <Picker.Item label="PPM" value="PPM" />
            <Picker.Item label="Percentage" value="Percentage" />
          </Picker>
        </View>

        <View style={[styles.sectionContainer, isDarkMode && styles.darkSection]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkSectionTitle]}>Preferences</Text>
          <View style={styles.optionContainer}>
            <Text style={[styles.label, isDarkMode && styles.darkLabel]}>Dark Mode</Text>
            <Switch value={isDarkMode} onValueChange={setIsDarkMode} />
          </View>

          <View style={styles.optionContainer}>
            <Text style={[styles.label, isDarkMode && styles.darkLabel]}>Notifications</Text>
            <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default Settings;

const styles = StyleSheet.create({
  background: {
    flex: 1, 
    backgroundColor: '#F1F8E9',
  },
  darkBackground: {
    backgroundColor: "#1E1E1E",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  title: {
    color: '#3E2723',
    fontSize: 30,
    fontWeight: 'bold',
  },
  darkTitle: {
    color: "#FFFFFF",
  },
  sectionContainer: {
    backgroundColor: 'rgba(255, 243, 224, 0.8)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
  },
  darkSection: {
    backgroundColor: "#333333",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#3E2723',
  },
  darkSectionTitle: {
    color: "#FFFFFF",
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5D4037',
    marginBottom: 5,
  },
  darkLabel: {
    color: "#DDDDDD",
  },
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: '#E8F5E9',
    borderRadius: 5,
    marginBottom: 10,
  },
  darkPicker: {
    backgroundColor: "#444444",
    color: "#FFFFFF",
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  arcImage: {
    height: 350,
    width: 400,
    resizeMode: 'contain',
    marginBottom: -100,
    marginTop: -150,
    marginLeft: -20,
  },
  lowerLeftImage: {
    position: 'absolute',
    bottom: -200,
    left: -150,
    height: 450,
    width: 450,
  },
});
