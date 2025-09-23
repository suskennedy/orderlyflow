import { Stack } from "expo-router";
import React from "react";
import { Platform, StatusBar } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { CalendarProvider } from "../lib/contexts/CalendarContext";
import { FamilyProvider } from "../lib/contexts/FamilyContext";
import { HomesProvider } from "../lib/contexts/HomesContext";
import { InventoryProvider } from "../lib/contexts/InventoryContext";
import { ProjectsProvider } from "../lib/contexts/ProjectsContext";
import { RepairsProvider } from "../lib/contexts/RepairsContext";
import { TasksProvider } from "../lib/contexts/TasksContext";
import { ThemeProvider, useTheme } from "../lib/contexts/ThemeContext";
import { ToastProvider } from "../lib/contexts/ToastContext";
import { VendorsProvider } from "../lib/contexts/VendorsContext";

function AppContent() {
  const { isDark, colors } = useTheme();

  return (
    <>
      {/* Dynamic status bar based on theme */}
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Use SafeAreaView with edges prop to handle both top and bottom system UI elements */}
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top", "left", "right"]}
      >
        <ToastProvider>
          <FamilyProvider>
            <HomesProvider>
              <CalendarProvider>
                <TasksProvider>
                  <RepairsProvider>
                    <ProjectsProvider>
                      <VendorsProvider>
                        <InventoryProvider>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          contentStyle: {
                            backgroundColor: colors.background,
                            ...(Platform.OS === "android" && {
                              paddingBottom: 0,
                            }),
                          },
                          animation: "slide_from_right",
                        }}
                      >
                        <Stack.Screen
                          name="index"
                          options={{
                            headerShown: false,
                          }}
                        />
                        <Stack.Screen
                          name="(auth)"
                          options={{
                            headerShown: false,
                          }}
                        />
                        <Stack.Screen
                          name="(tabs)"
                          options={{
                            headerShown: false,
                            gestureEnabled: false,
                          }}
                        />
                        <Stack.Screen
                          name="(profile)"
                          options={{
                            headerShown: false,
                          }}
                        />
                        <Stack.Screen
                          name="invite"
                          options={{
                            headerShown: false,
                          }}
                        />
                      </Stack>
                        </InventoryProvider>
                      </VendorsProvider>
                    </ProjectsProvider>
                  </RepairsProvider>
                </TasksProvider>
              </CalendarProvider>
            </HomesProvider>
          </FamilyProvider>
        </ToastProvider>
      </SafeAreaView>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
