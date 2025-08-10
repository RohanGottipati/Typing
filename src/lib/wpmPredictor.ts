// Simple Linear Regression implementation for WPM prediction
export interface SessionFeatures {
  testDuration: number;
  totalErrors: number;
  accuracy: number;
  backspaces: number;
  consistencyScore: number;
  reactionDelay: number;
  averageWPM: number; // Rolling average of last 5 sessions
  sessionCount: number;
  daysSinceFirstSession: number;
}

export interface PredictionResult {
  predictedWPM: number;
  confidence: number;
  features: SessionFeatures;
  lastUpdated: Date;
}

class SimpleLinearRegression {
  private weights: number[] = [];
  private bias: number = 0;
  private isTrained: boolean = false;

  // Simple gradient descent training
  train(features: number[][], targets: number[], learningRate: number = 0.01, epochs: number = 1000) {
    if (features.length === 0 || features.length !== targets.length) {
      console.log('⚠️ WPM Predictor: Insufficient data for training');
      return;
    }

    const numFeatures = features[0].length;
    this.weights = new Array(numFeatures).fill(0);
    this.bias = 0;

    console.log(`🧠 WPM Predictor: Training model with ${features.length} samples, ${numFeatures} features`);

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalLoss = 0;
      const gradients = new Array(numFeatures).fill(0);
      let biasGradient = 0;

      // Forward pass and gradient calculation
      for (let i = 0; i < features.length; i++) {
        const prediction = this.predict(features[i]);
        const error = prediction - targets[i];
        totalLoss += error * error;

        // Calculate gradients
        for (let j = 0; j < numFeatures; j++) {
          gradients[j] += error * features[i][j];
        }
        biasGradient += error;
      }

      // Update weights and bias
      for (let j = 0; j < numFeatures; j++) {
        this.weights[j] -= (learningRate * gradients[j]) / features.length;
      }
      this.bias -= (learningRate * biasGradient) / features.length;

      // Early stopping if loss is very small
      if (totalLoss / features.length < 0.001) {
        console.log(`🧠 WPM Predictor: Early stopping at epoch ${epoch + 1}`);
        break;
      }
    }

    this.isTrained = true;
    console.log('🧠 WPM Predictor: Model training completed');
  }

  predict(features: number[]): number {
    if (!this.isTrained || features.length !== this.weights.length) {
      return 0;
    }

    let prediction = this.bias;
    for (let i = 0; i < features.length; i++) {
      prediction += this.weights[i] * features[i];
    }

    return Math.max(0, prediction); // WPM cannot be negative
  }

  getWeights(): number[] {
    return [...this.weights];
  }

  getBias(): number {
    return this.bias;
  }

  isModelTrained(): boolean {
    return this.isTrained;
  }
}

export class WPMPredictor {
  private model: SimpleLinearRegression;
  private lastPrediction: PredictionResult | null = null;
  private minSessionsForTraining: number = 1; // Changed from 5 to 1

  constructor() {
    this.model = new SimpleLinearRegression();
  }

  // Extract features from session data
  private extractFeatures(sessions: any[], currentSessionIndex: number): SessionFeatures {
    const currentSession = sessions[currentSessionIndex];
    const previousSessions = sessions.slice(0, currentSessionIndex);
    
    // Calculate rolling average WPM from last 5 sessions
    const recentSessions = previousSessions.slice(-5);
    const averageWPM = recentSessions.length > 0 
      ? recentSessions.reduce((sum, session) => sum + session.wpm, 0) / recentSessions.length
      : currentSession.wpm;

    // Calculate days since first session
    const firstSession = sessions[0];
    const daysSinceFirstSession = firstSession && firstSession.timestamp
      ? (Date.now() - new Date(firstSession.timestamp).getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    return {
      testDuration: currentSession.testDuration || 30,
      totalErrors: (currentSession.totalCharacters || 0) - (currentSession.correctCharacters || 0),
      accuracy: currentSession.accuracy || 0,
      backspaces: currentSession.backspaces || 0,
      consistencyScore: currentSession.typingConsistencyScore || 50,
      reactionDelay: currentSession.reactionDelay || 0,
      averageWPM: averageWPM,
      sessionCount: currentSessionIndex + 1,
      daysSinceFirstSession: daysSinceFirstSession
    };
  }

  // Convert features to array for model input
  private featuresToArray(features: SessionFeatures): number[] {
    return [
      features.testDuration / 100, // Normalize duration
      features.totalErrors / 10, // Normalize errors
      features.accuracy / 100, // Normalize accuracy
      features.backspaces / 10, // Normalize backspaces
      features.consistencyScore / 100, // Normalize consistency
      Math.min(features.reactionDelay / 5, 1), // Normalize reaction delay
      features.averageWPM / 100, // Normalize WPM
      Math.min(features.sessionCount / 50, 1), // Normalize session count
      Math.min(features.daysSinceFirstSession / 30, 1) // Normalize days
    ];
  }

  // Train the model on historical data
  private trainModel(sessions: any[]): boolean {
    if (sessions.length < this.minSessionsForTraining) {
      console.log(`🧠 WPM Predictor: Need at least ${this.minSessionsForTraining} session for training, got ${sessions.length}`);
      return false;
    }

    const features: number[][] = [];
    const targets: number[] = [];

    // Use all sessions except the last one for training
    for (let i = 0; i < sessions.length - 1; i++) {
      const sessionFeatures = this.extractFeatures(sessions, i);
      const featureArray = this.featuresToArray(sessionFeatures);
      const targetWPM = sessions[i + 1].wpm; // Predict next session's WPM

      features.push(featureArray);
      targets.push(targetWPM);
    }

    if (features.length === 0) {
      console.log('🧠 WPM Predictor: No training data available');
      return false;
    }

    this.model.train(features, targets);
    return this.model.isModelTrained();
  }

  // Make prediction for next session
  predictNextSessionWPM(sessions: any[]): PredictionResult | null {
    if (sessions.length === 0) {
      console.log('🧠 WPM Predictor: No sessions available for prediction');
      return null;
    }

    // Train model if we have enough data
    if (sessions.length >= this.minSessionsForTraining) {
      const trainingSuccess = this.trainModel(sessions);
      if (!trainingSuccess) {
        console.log('🧠 WPM Predictor: Model training failed');
        return null;
      }
    } else {
      // Not enough data for prediction
      console.log(`🧠 WPM Predictor: Need at least ${this.minSessionsForTraining} session for prediction`);
      return null;
    }

    // Extract features from the most recent session
    const latestSessionIndex = sessions.length - 1;
    const features = this.extractFeatures(sessions, latestSessionIndex);
    const featureArray = this.featuresToArray(features);

    // Make prediction
    const predictedWPM = this.model.predict(featureArray);
    
    // Calculate confidence based on model performance
    const confidence = this.calculateConfidence(sessions);

    const result: PredictionResult = {
      predictedWPM: Math.round(predictedWPM * 10) / 10, // Round to 1 decimal
      confidence: confidence,
      features: features,
      lastUpdated: new Date()
    };

    this.lastPrediction = result;
    console.log(`🧠 WPM Predictor: Predicted WPM: ${result.predictedWPM} (confidence: ${confidence.toFixed(1)}%)`);
    
    return result;
  }

  // Calculate prediction confidence based on recent model accuracy
  private calculateConfidence(sessions: any[]): number {
    if (sessions.length < 2) {
      return 50; // Default confidence for new models with only 1 session
    }

    let totalError = 0;
    let predictionCount = 0;

    // Test model accuracy on recent sessions
    for (let i = 1; i < sessions.length - 1; i++) {
      const testSessions = sessions.slice(0, i + 1);
      const actualWPM = sessions[i + 1].wpm;
      
      // Train model on subset and predict
      const tempModel = new SimpleLinearRegression();
      const features: number[][] = [];
      const targets: number[] = [];

      for (let j = 0; j < testSessions.length - 1; j++) {
        const sessionFeatures = this.extractFeatures(testSessions, j);
        const featureArray = this.featuresToArray(sessionFeatures);
        const targetWPM = testSessions[j + 1].wpm;

        features.push(featureArray);
        targets.push(targetWPM);
      }

      tempModel.train(features, targets);
      
      const latestFeatures = this.extractFeatures(testSessions, testSessions.length - 1);
      const featureArray = this.featuresToArray(latestFeatures);
      const predictedWPM = tempModel.predict(featureArray);
      
      totalError += Math.abs(predictedWPM - actualWPM);
      predictionCount++;
    }

    if (predictionCount === 0) {
      return 50;
    }

    const averageError = totalError / predictionCount;
    const averageWPM = sessions.reduce((sum, session) => sum + session.wpm, 0) / sessions.length;
    
    // Confidence decreases with higher relative error
    const relativeError = averageError / averageWPM;
    const confidence = Math.max(20, Math.min(95, 100 - (relativeError * 100)));
    
    return confidence;
  }

  // Get the last prediction
  getLastPrediction(): PredictionResult | null {
    return this.lastPrediction;
  }

  // Check if model is ready for predictions
  isReady(sessionCount: number): boolean {
    return sessionCount >= this.minSessionsForTraining;
  }

  // Get model information
  getModelInfo(): { isTrained: boolean; minSessions: number; weights: number[] } {
    return {
      isTrained: this.model.isModelTrained(),
      minSessions: this.minSessionsForTraining,
      weights: this.model.getWeights()
    };
  }
}

// Global predictor instance
export const wpmPredictor = new WPMPredictor();
