import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import SignupForm from '../auth/forms/SignupForm';

const { width, height } = Dimensions.get('window');

const HARBOR_BLUE = '#5B8FA8';
const DEEP_NAVY = '#2B3240';

const ONBOARDING_STEPS = [
    {
        id: 1,
        title: "Hi, I'm Flo",
        description: "I'm here to help you organize your life and keep track of everything that matters.",
        image: require('../../assets/flo-poses/flo-pose1-Welcoming.png'),
    },
    {
        id: 2,
        title: "You remember everything.",
        description: "But you don't have to carry it all in your head. Let's make some space for what's important.",
        image: require('../../assets/flo-poses/flo-pose4-Neutral-Standing.png'),
    },
    {
        id: 3,
        title: "Let's get it out of your head.",
        description: "Tell me what needs to be done, and I'll make sure it's organized and easy to find.",
        image: require('../../assets/flo-poses/flo-pose2-Pointing.png'),
    },
    {
        id: 4,
        title: "I've got your back!",
        description: "I'll remind you when things are due and help you stay on top of your tasks effortlessly.",
        image: require('../../assets/flo-poses/flo-pose3-Celebrating.png'),
    },
    {
        id: 5,
        title: "Let's Get Started!",
        description: "Create your account to start your journey with me.",
        image: require('../../assets/flo-poses/flo-pose3-Celebrating-2-1.png'),
    },
];

export default function OnboardingFlow() {
    const [currentPage, setCurrentPage] = useState(0);
    const pagerRef = useRef<PagerView>(null);

    const handlePageChange = (e: any) => {
        setCurrentPage(e.nativeEvent.position);
    };

    const handleSkip = () => {
        pagerRef.current?.setPage(4);
    };

    const handleNext = () => {
        if (currentPage < 4) {
            pagerRef.current?.setPage(currentPage + 1);
        }
    };

    const renderDots = () => {
        return (
            <View style={styles.dotsContainer}>
                {ONBOARDING_STEPS.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.dot,
                            currentPage === index && styles.activeDot,
                        ]}
                    />
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {currentPage < 4 && (
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            )}

            <PagerView
                style={styles.pagerView}
                initialPage={0}
                onPageSelected={handlePageChange}
                ref={pagerRef}
            >
                {ONBOARDING_STEPS.map((step, index) => (
                    <View key={step.id} style={styles.page}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.scrollContent}
                        >
                            <View style={styles.imageContainer}>
                                <Image source={step.image} style={styles.image} resizeMode="contain" />
                            </View>

                            <View style={styles.textContainer}>
                                <Text style={styles.title}>{step.title}</Text>
                                <Text style={styles.description}>{step.description}</Text>
                            </View>

                            {index === 4 && (
                                <View style={styles.formContainer}>
                                    <SignupForm isOnboarding={true} />
                                </View>
                            )}
                        </ScrollView>
                    </View>
                ))}
            </PagerView>

            <View style={styles.footer}>
                {renderDots()}

                {currentPage < 4 && (
                    <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                        <Ionicons name="arrow-forward" size={30} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    skipButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    skipText: {
        fontFamily: 'Jost_500Medium',
        fontSize: 16,
        color: DEEP_NAVY,
        textDecorationLine: 'underline',
    },
    pagerView: {
        flex: 1,
    },
    page: {
        flex: 1,
        width: width,
    },
    scrollContent: {
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingTop: 40,
        paddingBottom: 40,
    },
    imageContainer: {
        width: width * 0.8,
        height: height * 0.35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontFamily: 'CormorantGaramond_700Bold',
        fontSize: 32,
        color: DEEP_NAVY,
        textAlign: 'center',
        marginBottom: 15,
    },
    description: {
        fontFamily: 'Jost_400Regular',
        fontSize: 18,
        color: DEEP_NAVY,
        textAlign: 'center',
        lineHeight: 26,
    },
    formContainer: {
        width: '100%',
        marginTop: 20,
    },
    footer: {
        height: 80,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
        paddingBottom: 20,
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 4,
    },
    activeDot: {
        width: 24,
        backgroundColor: HARBOR_BLUE,
    },
    nextButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: HARBOR_BLUE,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});
