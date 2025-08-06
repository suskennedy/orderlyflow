import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/contexts/ThemeContext';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const TypingDots = ({ colors }: { colors: any }) => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(dot, {
            toValue: 1,
            duration: 600,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = [
      animateDot(dot1, 0),
      animateDot(dot2, 200),
      animateDot(dot3, 400),
    ];

    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingDots}>
      <Animated.View style={[styles.dot, { backgroundColor: colors.textSecondary, opacity: dot1 }]} />
      <Animated.View style={[styles.dot, { backgroundColor: colors.textSecondary, opacity: dot2 }]} />
      <Animated.View style={[styles.dot, { backgroundColor: colors.textSecondary, opacity: dot3 }]} />
    </View>
  );
};

export default function ChatScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm Flo, your AI home management assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response with realistic delay
    const delay = 1500 + Math.random() * 2000;
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(userMessage.text),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, delay);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const getAIResponse = (userText: string): string => {
    const lowerText = userText.toLowerCase();
    
    if (lowerText.includes('task') || lowerText.includes('maintenance')) {
      return "I can help you create and manage home maintenance tasks! You can set up recurring tasks like changing air filters, cleaning gutters, or testing smoke detectors. Would you like me to suggest some common maintenance tasks for your home?";
    } else if (lowerText.includes('schedule') || lowerText.includes('calendar')) {
      return "Great! I can help you schedule maintenance tasks and set up reminders. You can create recurring schedules like monthly, quarterly, or seasonal tasks. What kind of maintenance schedule are you looking to set up?";
    } else if (lowerText.includes('vendor') || lowerText.includes('contractor')) {
      return "I can help you organize your service providers and contractors! You can store their contact information, specialties, and notes about their work. Are you looking to add a new vendor or manage existing ones?";
    } else if (lowerText.includes('home') || lowerText.includes('house')) {
      return "I'm here to help with all aspects of home management! I can assist with organizing your home inventory, tracking appliances, managing paint colors, warranties, and materials. What specific area of your home would you like to work on?";
    } else if (lowerText.includes('help') || lowerText.includes('what can you do')) {
      return "I can help you with:\n\n• Creating and managing maintenance tasks\n• Setting up schedules and reminders\n• Organizing vendor information\n• Tracking home inventory and appliances\n• Managing warranties and paint colors\n• Providing home maintenance tips\n\nWhat would you like to start with?";
    } else if (lowerText.includes('appliance')) {
      return "I can help you track your home appliances! You can store information like brand, model, purchase date, warranty details, and maintenance schedules. Would you like help organizing your appliance information?";
    } else if (lowerText.includes('paint') || lowerText.includes('color')) {
      return "Managing paint colors is important for home maintenance! I can help you track paint brands, color codes, hex values, and which rooms they're used in. This makes touch-ups and repainting much easier. Want to organize your paint information?";
    } else if (lowerText.includes('warranty')) {
      return "Keeping track of warranties is crucial! I can help you organize warranty information for all your home items - start dates, end dates, providers, and important notes. Never miss a warranty claim again!";
    } else {
      return "That's a great question! I'm here to help you manage your home more efficiently. I can assist with maintenance tasks, scheduling, vendor management, and organizing your home inventory. Is there a specific area you'd like help with?";
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.aiMessage
    ]}>
      {!item.isUser && (
        <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
        </View>
      )}
      <View style={[
        styles.messageBubble,
        {
          backgroundColor: item.isUser ? colors.primary : colors.surface,
          borderColor: colors.border,
        }
      ]}>
        <Text style={[
          styles.messageText,
          { color: item.isUser ? colors.background : colors.text }
        ]}>
          {item.text}
        </Text>
        <Text style={[
          styles.timestamp,
          { color: item.isUser ? colors.background + '80' : colors.textSecondary }
        ]}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  const renderTypingIndicator = () => (
    <View style={[styles.messageContainer, styles.aiMessage]}>
      <View style={[styles.avatarContainer, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
      </View>
      <View style={[
        styles.messageBubble,
        styles.typingBubble,
        { backgroundColor: colors.surface, borderColor: colors.border }
      ]}>
        <TypingDots colors={colors} />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
    >
      {/* Header */}
      <View style={[
        styles.header,
        { 
          backgroundColor: colors.surface,
          paddingTop: insets.top + 20,
          borderBottomColor: colors.border
        }
      ]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={[styles.headerAvatar, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Flo Assistant</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {isTyping ? 'Typing...' : 'AI Home Management Helper'}
            </Text>
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messagesList,
          { paddingBottom: 20 }
        ]}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={isTyping ? renderTypingIndicator : null}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        keyboardShouldPersistTaps="handled"
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
      />

      {/* Input Area */}
      <View style={[
        styles.inputContainer,
        { 
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 20
        }
      ]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask Flo anything about your home..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim() ? colors.primary : colors.surfaceVariant,
              }
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isTyping}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? colors.background : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.primaryLight }]}
            onPress={() => setInputText('Help me create a maintenance task')}
            disabled={isTyping}
          >
            <Text style={[styles.quickActionText, { color: colors.primary }]}>
              Create Task
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.primaryLight }]}
            onPress={() => setInputText('Show me maintenance tips')}
            disabled={isTyping}
          >
            <Text style={[styles.quickActionText, { color: colors.primary }]}>
              Maintenance Tips
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: colors.primaryLight }]}
            onPress={() => setInputText('Help me organize my home')}
            disabled={isTyping}
          >
            <Text style={[styles.quickActionText, { color: colors.primary }]}>
              Home Organization
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  messagesList: {
    padding: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingBubble: {
    paddingVertical: 16,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  quickAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flex: 1,
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 