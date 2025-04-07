import React, { createContext, useContext, useState } from "react";

const SettingsContext = createContext();

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState("English");
  const [temperatureUnit, setTemperatureUnit] = useState("Celsius");
  const [moistureUnit, setMoistureUnit] = useState("Relative Humidity");
  const [gasUnit, setGasUnit] = useState("PPM");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  console.log('SettingsProvider children:', children);

  return (
    <SettingsContext.Provider
      value={{
        isDarkMode,
        setIsDarkMode,
        language,
        setLanguage,
        temperatureUnit,
        setTemperatureUnit,
        moistureUnit,
        setMoistureUnit,
        gasUnit,
        setGasUnit,
        notificationsEnabled,
        setNotificationsEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
