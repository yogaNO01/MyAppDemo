// DuolingoChoice.jsx
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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [currentProgress, setCurrentProgress] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  
  const progressInterval = useRef(null);

  // 缩放动画函数
  const triggerScaleAnimation = () => {
    // 使用序列动画确保顺序执行
    Animated.sequence([
      // 先放大到1.2倍
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      // 等待1秒
      Animated.delay(1000),
      // 恢复为1倍
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  useEffect(() => {
    // 启动进度条动画 - 每隔10秒增加10%
    progressInterval.current = setInterval(() => {
      setCurrentProgress(prev => {
        const newProgress = Math.min(prev + 10, 100);
        
        // 触发缩放动画
        triggerScaleAnimation();
        
        // 使用动画更新进度条
        Animated.timing(progress, {
          toValue: newProgress,
          duration: 500,
          useNativeDriver: true, // 宽度变化不支持原生驱动
        }).start();
        
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
    
    // 停止进度条
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
    scaleAnim.setValue(1);
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    progressInterval.current = setInterval(() => {
      setCurrentProgress(prev => {
        const newProgress = Math.min(prev + 10, 100);
        triggerScaleAnimation();
        Animated.timing(progress, {
          toValue: newProgress,
          duration: 500,
          useNativeDriver: false,
        }).start();
        return newProgress;
      });
    }, 10000);
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
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/icon/close.png')}
          style={styles.closeIcon}
        />
        {/* 进度条容器 - 使用绝对定位来处理缩放中心点 */}
        <View style={styles.progressWrapper}>
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar, 
                { 
                  width: progress.interpolate({ 
                    inputRange: [0, 100], 
                    outputRange: ['0%', '100%'] 
                  }),
                  transform: [{ scaleX: scaleAnim }] // 只缩放X轴，保持高度不变
                }
              ]}
            />
            <Image 
              source={require('@/assets/images/icon/process.png')}
              style={styles.progressIcon}
            />
          </View>
        </View>
      </View>

      <View style={styles.wordHeader}>
        <Image 
          source={require('@/assets/images/icon/wordIcon.png')}
          style={styles.wordIcon}
        />
        <Text style={styles.wordLabel}>新单词</Text>
      </View>

      <Text style={styles.title}>翻译这句话</Text>
      
      <LottieView
        source={require('@/assets/images/lottie/PATH_BEA_COOKING.json')}
        style={styles.lottieAnimation}
        autoPlay={true}
        loop={true}
        resizeMode="cover"
      />
      
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
  header: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30
  },
  closeIcon: {
    width: 25,
    height: 25,
    marginRight: 18,
    alignSelf: 'flex-start'
  },
  progressWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  progressBarContainer: {
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    position: 'relative',
  },
  progressIcon: {
    width: 22,
    height: 7,
    position: 'absolute',
    top: 5.5,
    left: 17,
    zIndex: 10,
    borderRadius: 20
  },
  wordHeader: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center'
  },
  wordIcon: {
    width: 25,
    height: 25,
    marginRight: 14
  },
  wordLabel: {
    color: '#9265fb',
    fontSize: 16,
    fontWeight: '600'
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#343434',
    marginBottom: 20
  },
  lottieAnimation: {
    width: 200,
    height: 200,
    marginBottom: 20,
    alignSelf: 'center'
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