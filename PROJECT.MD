# **Project: Hyper-Othello 666 (3D WebGL)**

## **1\. 專案概述**

這是一個基於 Web 的 3D 黑白棋（Othello/Reversi）遊戲。

* **棋盤規格**：![][image1] 立方體網格（共 216 格）。  
* **物理規則**：無重力模式（Zero-gravity）。只要符合夾吃規則，棋子可以放置在 3D 空間的任何位置，無需下方有支撐。  
* **玩家模式**：單機雙人輪流對戰（Hotseat Multiplayer）。  
* **目標平台**：Web (Desktop/Mobile)，使用 GitHub Pages 託管。

## **2\. 技術棧 (Tech Stack)**

* **核心框架**：React 18+ (使用 Vite 建構)  
* **3D 引擎**：Three.js (透過 @react-three/fiber 封裝)  
* **3D 互動**：@react-three/drei (提供 OrbitControls, Text, etc.)  
* **樣式與 UI**：Tailwind CSS (處理 HUD、計分板、按鈕)  
* **狀態管理**：Zustand 或 React Context (處理遊戲邏輯狀態)  
* **語言**：TypeScript (強烈建議，用於處理複雜的 3D 座標邏輯)

## **3\. 核心遊戲邏輯 (Game Logic)**

### **3.1 數據結構**

* 使用一維陣列或三維陣列存儲棋盤狀態：  
  type CellState \= 0 | 1 | 2; (0: Empty, 1: Black/P1, 2: White/P2)  
  const board \= new Array(6).fill(0).map(() \=\> new Array(6).fill(0).map(() \=\> new Array(6).fill(0)));

### **3.2 初始設置**

* 在立方體正中心 ![][image2] 區域（座標範圍 \[2,2,2\] 到 \[3,3,3\]）交叉放置 8 顆棋子，保持黑白平衡。

### **3.3 合法移動檢查 (Valid Move Check)**

* **輸入**：座標 ![][image3]，當前玩家 ![][image4]。  
* **向量**：必須遍歷 26 個 3D 方向向量 ![][image5]，其中 ![][image6] 且排除 ![][image7]。  
* **算法**：  
  1. 檢查該格是否為空。  
  2. 向每個向量發射射線，檢查是否夾住對手棋子。  
  3. 必須至少在一個方向上成功夾住對手棋子才算合法移動。

### **3.4 視覺化邏輯 (Critical UX)**

由於 3D 視線遮擋問題，必須實作以下機制：

1. **透明度策略**：空的格子顯示為半透明的線框或微小的點，已落子的格子顯示為實體球。  
2. **輔助高亮 (Hints)**：  
   * 當輪到某方時，計算所有「合法落子點」，並在這些位置顯示綠色半透明指示球。這對降低 3D 認知負擔至關重要。  
   * 滑鼠懸停 (Hover) 在合法位置時，預覽顯示會被翻轉的對手棋子（例如變色或閃爍）。

## **4\. UI/UX 設計**

### **4.1 3D 場景 (Canvas)**

* **背景**：深色星空或漸層，以凸顯棋子。  
* **控制**：OrbitControls 允許玩家 360 度旋轉、縮放視角。  
* **點擊**：使用 Raycaster 偵測滑鼠點擊的格子座標。

### **4.2 HUD (Heads-Up Display)**

* **頂部**：當前玩家提示（黑方/白方）、當前比分（黑: X / 白: Y）。  
* **底部/側邊**：  
  * \[重置遊戲\] 按鈕。  
  * \[切片視圖 (Slicer)\] 滑桿（可選）：允許玩家隱藏 X/Y/Z 軸向的某些層，以便觀察內部。

## **5\. 開發步驟 (Implementation Roadmap)**

### **Phase 1: 專案初始化**

1. 使用 Vite 建立 React \+ TypeScript 專案。  
2. 安裝依賴：npm install three @types/three @react-three/fiber @react-three/drei zustand tailwindcss postcss autoprefixer。  
3. 配置 Tailwind CSS。

### **Phase 2: 核心邏輯實作 (Logic First)**

1. 實作 useGameStore (Zustand)：包含 board, currentPlayer, scores。  
2. 實作 checkValidMove(board, x, y, z, player) 函數（包含 26 方向檢查）。  
3. 實作 flipPieces(board, x, y, z, player) 函數。  
4. 編寫單元測試確保邏輯正確（特別是邊界條件）。

### **Phase 3: 3D 渲染 (Visuals)**

1. 建立 \<GameScene /\> 組件。  
2. 建立 \<Cell /\> 組件：根據狀態渲染空心框或實體球。  
3. 整合 OrbitControls。  
4. 實作點擊互動：點擊觸發 placePiece action。

### **Phase 4: UI 與優化**

1. 添加 HTML Overlay：顯示分數與回合。  
2. 添加「合法移動提示」功能（計算所有合法步並高亮）。  
3. 優化效能：使用 InstancedMesh 來渲染 216 個格子（如果效能有瓶頸），但在 ![][image8] 規模下，普通的 Mesh 應該足夠。

## **6\. 交付物**

* 完整的源代碼 (GitHub Repository)。  
* 部署腳本 (GitHub Actions workflow)。
