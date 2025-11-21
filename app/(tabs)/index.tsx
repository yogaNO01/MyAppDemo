import { Image } from 'expo-image';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View
} from 'react-native';
const { width } = Dimensions.get('window');
const BADGE_SIZE = 36;
const CARD_PADDING = 16;
const CARD_MIN_HEIGHT = 64;

const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function HomeScreen({
  question = 'Which sentence is correct?',
  choices = ['I has cat.', 'I have a cat.', 'I having a cat.', 'I had a cat.'],
  correctIndex = 1,
  onAnswer = (isCorrect, selectedIndex) => {},
  showCorrectAfterAnswer = true,
  disabled = false,
}) {
  
  const progress = useRef(new Animated.Value(0)).current;
  const [currentProgress, setCurrentProgress] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [sacle, setSacle] = useState(1.2);
  
  // 气泡文字跳起动画
  const bubbleTextAnim = useRef(new Animated.Value(0)).current;
  
  // 进度条定时器引用
  const progressInterval = useRef(null);

  useEffect(() => {
    // 启动气泡文字跳起动画（循环执行）
    const startBubbleAnimation = () => {
      Animated.sequence([
        Animated.timing(bubbleTextAnim, {
          toValue: -10, // 向上跳10px
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(bubbleTextAnim, {
          toValue: 0, // 落回原位
          duration: 300,
          useNativeDriver: true,
        }),
        // Animated.delay(2000), // 等待2秒后再次执行
      ]).start(() => {
        // startBubbleAnimation(); // 循环执行
      });
    };

    startBubbleAnimation();

    // 启动进度条动画 - 每隔10秒增加10%
    progressInterval.current = setInterval(() => {
      setCurrentProgress(prev => {
        const newProgress = Math.min(prev + 10, 100);
        setSacle(1.2);
        Animated.timing(progress, {
          toValue: newProgress,
          duration: 500,
          useNativeDriver: false,
        }).start();
        setSacle(1.2);
        return newProgress;
      });
    }, 10000);

    // 组件卸载时清除定时器
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  // 当用户选择答案时停止进度条
  const handleSelect = (i) => {
    if (disabled || revealed) return;
    
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    
    setSelected(i);
    setRevealed(true);
    const isCorrect = i === correctIndex;
    setTimeout(() => onAnswer(Boolean(isCorrect), i), 200);
  };

  // 重置进度条（如果需要重新开始）
  const resetProgress = () => {
    setCurrentProgress(0);
    progress.setValue(0);
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    progressInterval.current = setInterval(() => {
      setCurrentProgress(prev => {
        const newProgress = Math.min(prev + 10, 100);
        Animated.timing(progress, {
          toValue: newProgress,
          duration: 500,
          useNativeDriver: false,
        }).start();
        return newProgress;
      });
    }, 5000);
  };

  // animated values per choice for scale & background interpolation
  const animValues = useRef(choices.map(() => new Animated.Value(0))).current;
  
  const onPressIn = (i) => {
    Animated.spring(animValues[i], {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 200,
    }).start();
  };
  
  const onPressOut = (i) => {
    Animated.spring(animValues[i], {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 150,
    }).start();
  };

  const renderChoice = ({ item, index }) => {
    const isSelected = selected === index;
    const isCorrect = index === correctIndex;
    const animatedScale = animValues[index].interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.97],
    });

    let backgroundColor = '#ffffff';
    let borderColor = '#e6e6e6';
    let textColor = '#222';

    if (revealed) {
      if (isCorrect) {
        backgroundColor = '#007AFF30';
        borderColor = '#007AFF';
        textColor = '#0a5d1f';
      } else if (isSelected && !isCorrect) {
        backgroundColor = '#ffecec';
        borderColor = '#ffb3b3';
        textColor = '#7a1b1b';
      } else {
        backgroundColor = '#fafafa';
        borderColor = '#f0f0f0';
        textColor = '#9a9a9a';
      }
    }

    const badgeBg = isSelected ? '#007AFF' : '#f1f1f1';
    const badgeText = isSelected ? '#fff' : '#666';

    return (
      <TouchableWithoutFeedback
        onPress={() => handleSelect(index)}
        disabled={disabled || revealed}
        onPressIn={() => onPressIn(index)}
        onPressOut={() => onPressOut(index)}
      >
        <Animated.View
          style={[
            styles.choiceCard,
            {
              backgroundColor,
              borderColor,
              transform: [{ scale: animatedScale }],
            },
          ]}
        >
          <View style={styles.cardLeft}>
            <View style={[styles.badge, { backgroundColor: badgeBg }]}>
              <Text style={[styles.badgeText, { color: badgeText }]}>
                {letters[index] ?? index + 1}
              </Text>
            </View>
            <View style={styles.choiceTextWrap}>
              <Text
                numberOfLines={2}
                style={[styles.choiceText, { color: textColor }]}
              >
                {item}
              </Text>
            </View>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ display: 'flex', flexDirection: 'row' , alignItems: 'center' ,marginBottom: 30 }}>
        <Image
          source={require('@/assets/images/icon/close.png')}
          style={{ width: 25, height: 25, marginRight: 18, alignSelf: 'flex-start' }}
        />
        <View style={styles.progressBarContainer}>
          <Animated.View 
            style={[
              styles.progressBar, 
              { 
                width: progress.interpolate({ 
                  inputRange: [0, 100], 
                  outputRange: ['0%', '100%'] 
                }),
                transform: [{ scale: sacle }]
              }
            ]}
          />
          <Image 
            source={require('@/assets/images/icon/process.png')}
            style={{ width: 25, height: 8, position: 'absolute', top: 6, left: 20, zIndex: 10, borderRadius: 20 }}
          />
        </View>
      </View>
      
      <View style={{ width: '100%', flexDirection: 'row', marginBottom: 15 }}>
        <Image 
          source={require('@/assets/images/icon/wordIcon.png')}
          style={{ width: 25, height: 25, marginRight: 14, alignSelf: 'flex-start' }}
        />
        <Text style={{ color: '#9265fb',fontSize: 16, fontWeight: 600 }}>新单词</Text>
      </View>

      <Text style={{ fontSize: 24, fontWeight: 700, color: '#343434', marginBottom: 20 }}>翻译这句话</Text>
      
      <View style={{ display: 'flex', flexDirection: 'row' }}>
        <LottieView
          source={require('@/assets/images/lottie/PATH_BEA_COOKING.json')}
          style={{ width: 180, height: 180, marginBottom: 20 }}
          autoPlay={true}
          loop={true}
          resizeMode="cover"
        />
        <View style={styles.bubble}>
          <View style={styles.triangle} />
          <Animated.Text 
            style={[
              styles.bubbleText,
              {
                transform: [{ translateY: bubbleTextAnim }]
              }
            ]}
          >
            coffee
          </Animated.Text>
        </View>
      </View>
      
      <View style={styles.questionBox}>
        <Text style={styles.questionText}>{question}</Text>
      </View>

      <FlatList
        data={choices}
        renderItem={renderChoice}
        keyExtractor={(_, idx) => String(idx)}
        contentContainerStyle={styles.choicesList}
        scrollEnabled={false}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {revealed
            ? selected === correctIndex
              ? 'Nice! You got it right.'
              : `Correct: ${letters[correctIndex] ?? correctIndex + 1}.`
            : 'Tap a choice to answer.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: Math.min(760, width - 24),
    height: '100%',
    alignSelf: 'center',
    paddingVertical: 60,
    paddingHorizontal: 5,
    backgroundColor: '#ffffff'
  },
  progressBarContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    height: 24,
    marginRight: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 14,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
    position: 'relative'
  },
  questionBox: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: '#f7fbf8',
    borderColor: '#e6f2e9',
    borderWidth: 1,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#14332f',
  },
  bubble: {
    width: 140,
    height: 50,
    marginTop: 30,
    borderColor: '#EBECED',
    borderRadius: 10,
    borderWidth: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  triangle: {
    position: 'absolute', 
    top: '35%', 
    left: -20, 
    width: 0, 
    height: 0,
    borderStyle: 'solid', 
    borderWidth: 10,
    borderRightColor: '#EBECED',
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent'
  },
  bubbleText: {
    fontSize: 16,
    color: '#9265fb',
    fontWeight: '700',
    letterSpacing: 1,
    borderStyle: 'dashed',
    borderColor: '#9265fb',
    borderBottomWidth: 1.9,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  choicesList: {
    gap: 10,
  },
  choiceCard: {
    minHeight: CARD_MIN_HEIGHT,
    borderRadius: 14,
    borderWidth: 1,
    padding: CARD_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 1,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: 14,
  },
  choiceTextWrap: {
    flex: 1,
  },
  choiceText: {
    fontSize: 16,
    lineHeight: 20,
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    color: '#6f6f6f',
  },
});