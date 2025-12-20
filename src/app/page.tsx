"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Button, 
  Input, 
  Textarea, 
  Card, 
  CardBody, 
  Tabs, 
  Tab, 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Chip,
  Select,
  SelectItem,
  Divider
} from "@heroui/react";
import { MessageCircle, BookOpen, Upload, Trash2, FileText, Plus, Loader2, Send, Download } from "lucide-react";

const API_BASE_URL = "http://localhost:18080/b/ibot";

interface KnowledgeBase {
  id: number;
  name: string;
  description: string;
  status: string;
  doc_count: number;
  created_at: string;
}

interface Document {
  id: number;
  name: string;
  file_type: string;
  file_size: number;
  status: string;
  chunk_count: number;
  created_at: string;
}

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"chat" | "kb">("chat");
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKbId, setSelectedKbId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<Array<{ 
    role: "user" | "assistant"; 
    content: string; 
    documents?: Array<{ id: number; name: string }>; 
  }>>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newKbName, setNewKbName] = useState("");
  const [newKbDescription, setNewKbDescription] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [parsingDocId, setParsingDocId] = useState<number | null>(null);

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  useEffect(() => {
    if (selectedKbId) {
      loadDocuments(selectedKbId);
    }
  }, [selectedKbId]);

  // 自动滚动到消息底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadKnowledgeBases = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/dataset/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = await response.json();
      if (result.code === 200) {
        setKnowledgeBases(result.data);
        if (result.data.length > 0 && !selectedKbId) {
          setSelectedKbId(result.data[0].id);
        }
      }
    } catch (error) {
      console.error("加载知识库失败:", error);
    }
  };

  const loadDocuments = async (kbId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/document/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knowledge_base_id: kbId }),
      });
      const result = await response.json();
      if (result.code === 200) {
        setDocuments(result.data);
      }
    } catch (error) {
      console.error("加载文档失败:", error);
    }
  };

  const createKnowledgeBase = async () => {
    if (!newKbName.trim()) {
      alert("请输入知识库名称");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/dataset/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKbName,
          description: newKbDescription,
          user_id: 1,
        }),
      });
      const result = await response.json();
      if (result.code === 200) {
        setNewKbName("");
        setNewKbDescription("");
        setIsCreateDialogOpen(false);
        loadKnowledgeBases();
      } else {
        alert(result.msg);
      }
    } catch (error) {
      console.error("创建知识库失败:", error);
      alert("创建失败");
    }
  };

  const deleteKnowledgeBase = async (id: number) => {
    if (!confirm("确定要删除这个知识库吗？这将删除所有相关文档。")) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/dataset/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (result.code === 200) {
        loadKnowledgeBases();
        if (selectedKbId === id) {
          setSelectedKbId(null);
        }
      } else {
        alert(result.msg);
      }
    } catch (error) {
      console.error("删除知识库失败:", error);
      alert("删除失败");
    }
  };

  const uploadDocument = async (file: File, kbId: number) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("knowledge_base_id", kbId.toString());

    try {
      const response = await fetch(`${API_BASE_URL}/document/upload`, {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (result.code === 200) {
        loadDocuments(kbId);
        // 取消自动解析，必须手动点击"开始解析"按钮
        // startParseDocument(result.data.id);
      } else {
        alert(result.msg);
      }
    } catch (error) {
      console.error("上传文档失败:", error);
      alert("上传失败");
    }
  };

  const startParseDocument = async (docId: number) => {
    setParsingDocId(docId);
    try {
      const response = await fetch(`${API_BASE_URL}/document/parse/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: docId }),
      });
      const result = await response.json();
      if (result.code === 200) {
        loadDocuments(selectedKbId!);
        checkDocumentStatus(docId);
      } else {
        setParsingDocId(null);
      }
    } catch (error) {
      console.error("开始解析失败:", error);
      setParsingDocId(null);
    }
  };

  const reparseDocument = async (docId: number) => {
    if (!confirm("确定要重新解析这个文档吗？这将删除旧的解析数据并重新解析。")) {
      return;
    }
    
    setParsingDocId(docId);
    try {
      const response = await fetch(`${API_BASE_URL}/document/parse/reparse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: docId }),
      });
      const result = await response.json();
      if (result.code === 200) {
        loadDocuments(selectedKbId!);
        checkDocumentStatus(docId);
      } else {
        setParsingDocId(null);
        alert(result.msg || "重新解析失败");
      }
    } catch (error) {
      console.error("重新解析失败:", error);
      setParsingDocId(null);
      alert("重新解析失败，请稍后重试");
    }
  };

  const checkDocumentStatus = async (docId: number) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/document/read`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ knowledge_base_id: selectedKbId }),
        });
        const result = await response.json();
        if (result.code === 200) {
          const doc = result.data.find((d: Document) => d.id === docId);
          if (doc && (doc.status === "completed" || doc.status === "failed")) {
            clearInterval(interval);
            setParsingDocId(null);
            loadDocuments(selectedKbId!);
          }
        }
      } catch (error) {
        clearInterval(interval);
        setParsingDocId(null);
      }
    }, 2000);
  };

  const deleteDocument = async (id: number) => {
    if (!confirm("确定要删除这个文档吗？")) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/document/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (result.code === 200) {
        loadDocuments(selectedKbId!);
      } else {
        alert(result.msg);
      }
    } catch (error) {
      console.error("删除文档失败:", error);
      alert("删除失败");
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedKbId) {
      alert("请先选择知识库并输入消息");
      return;
    }

    const userMessage = inputMessage;
    setInputMessage("");
    
    // 添加用户消息
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    
    // 添加空的assistant消息用于流式更新
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/rag/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          knowledge_base_id: selectedKbId,
          query: userMessage,
          k: 5,
        }),
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("响应体为空");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantMessage = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          
          // 保留最后一个可能不完整的行
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith("data: ")) {
              continue;
            }

            try {
              const jsonStr = trimmedLine.slice(6); // 移除 "data: " 前缀
              const data = JSON.parse(jsonStr);
              
              if (data.type === "token" && data.content) {
                // 流式更新assistant消息
                assistantMessage += data.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  // 找到最后一条assistant消息并更新
                  for (let i = newMessages.length - 1; i >= 0; i--) {
                    if (newMessages[i].role === "assistant") {
                      newMessages[i].content = assistantMessage;
                      break;
                    }
                  }
                  return newMessages;
                });
              } else if (data.type === "search_complete") {
                // 检索完成（可选：显示提示）
                console.log(`检索完成: 找到${data.doc_count}个相关文档`);
              } else if (data.type === "sources") {
                // 来源信息：保存文档列表到消息中（即使为空也要设置，以确保状态正确）
                const documents = data.documents || [];
                setMessages((prev) => {
                  const newMessages = [...prev];
                  // 找到最后一条assistant消息并设置文档列表（可能为空）
                  for (let i = newMessages.length - 1; i >= 0; i--) {
                    if (newMessages[i].role === "assistant") {
                      // 只有当有文档时才设置，否则保持undefined（不显示按钮）
                      if (documents.length > 0) {
                        newMessages[i].documents = documents;
                      }
                      // 如果没有文档，不设置documents字段，这样按钮就不会显示
                      break;
                    }
                  }
                  return newMessages;
                });
                console.log("来源文档数量:", documents.length);
              } else if (data.type === "done") {
                // 流式响应完成
                console.log("流式响应完成");
              } else if (data.type === "error") {
                throw new Error(data.error || "未知错误");
              }
            } catch (parseError) {
              // 忽略JSON解析错误，继续处理下一行
              console.warn("解析SSE数据失败:", parseError, trimmedLine);
            }
          }
        }

        // 处理剩余缓冲区
        if (buffer.trim()) {
          const trimmedLine = buffer.trim();
          if (trimmedLine.startsWith("data: ")) {
            try {
              const jsonStr = trimmedLine.slice(6);
              const data = JSON.parse(jsonStr);
              if (data.type === "token" && data.content) {
                assistantMessage += data.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  for (let i = newMessages.length - 1; i >= 0; i--) {
                    if (newMessages[i].role === "assistant") {
                      newMessages[i].content = assistantMessage;
                      break;
                    }
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              console.warn("解析剩余缓冲区失败:", e);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error("发送消息失败:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        // 更新最后一条assistant消息为错误信息
        for (let i = newMessages.length - 1; i >= 0; i--) {
          if (newMessages[i].role === "assistant") {
            newMessages[i].content = error instanceof Error ? `错误: ${error.message}` : "抱歉，发生了错误，请稍后重试。";
            break;
          }
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      processing: "secondary",
      failed: "destructive",
      pending: "outline",
    };
    const labels: Record<string, string> = {
      completed: "已完成",
      processing: "处理中",
      failed: "失败",
      pending: "待处理",
    };
    return (
      <Chip color={variants[status] === "default" ? "primary" : variants[status] === "destructive" ? "danger" : "default"} variant="flat">
        {labels[status] || status}
      </Chip>
    );
  };

  // 检测是否为"未找到答案"
  const isNoAnswerFound = (content: string): boolean => {
    if (!content || content.trim().length === 0) {
      return false;
    }
    const noAnswerKeywords = [
      "未找到答案",
      "找不到答案",
      "未找到",
      "找不到",
      "抱歉，未找到",
      "抱歉，找不到",
      "没有找到",
      "暂无答案",
      "无法找到",
    ];
    const lowerContent = content.toLowerCase();
    return noAnswerKeywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-6 py-4 shadow-soft backdrop-blur-sm">
      </header>

      <div className="flex flex-1 overflow-hidden">
      {/* 侧边栏 */}
      <div className="w-80 border-r border-slate-200/80 bg-white shadow-elegant">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200/60 p-6 bg-blue-100/60">
            <h1 className="text-2xl font-bold flex items-center gap-2 text-blue-700">
              <BookOpen className="h-6 w-6 text-blue-700" />
              General Agent
            </h1>
          </div>

          <Tabs 
            selectedKey={activeTab} 
            onSelectionChange={(key) => setActiveTab(key as "chat" | "kb")} 
            className="flex-1 flex flex-col"
          >
            <div className="px-4 pt-4">
              <Tabs aria-label="Options" className="w-full">
                <Tab
                  key="chat"
                  title={
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      对话
                    </div>
                  }
                />
                <Tab
                  key="kb"
                  title={
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      知识库
                    </div>
                  }
                />
              </Tabs>
            </div>

            <div className="flex-1 mt-4 px-4">
              {activeTab === "chat" && (
              <div className="space-y-4">
                <label className="text-sm font-semibold text-slate-700">选择知识库</label>
                <Select
                  selectedKeys={selectedKbId ? [selectedKbId.toString()] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setSelectedKbId(selected ? Number(selected) : null);
                  }}
                  placeholder="请选择知识库"
                  labelPlacement="outside"
                  classNames={{
                    base: "rounded-xl",
                    trigger: "rounded-xl",
                    popoverContent: "rounded-xl",
                  }}
                >
                  {knowledgeBases.map((kb) => (
                    <SelectItem key={kb.id.toString()} value={kb.id.toString()}>
                      {kb.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              )}
              {activeTab === "kb" && (
              <Modal 
                isOpen={isCreateDialogOpen} 
                onClose={() => {
                  setIsCreateDialogOpen(false);
                  setNewKbName("");
                  setNewKbDescription("");
                }}
                size="md"
                classNames={{
                  base: "rounded-2xl",
                  backdrop: "bg-black/50 backdrop-opacity-40",
                  header: "border-b border-slate-200",
                  footer: "border-t border-slate-200",
                }}
              >
                <ModalContent className="rounded-2xl">
                  <ModalHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-md">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-800">创建知识库</h2>
                        <p className="mt-1 text-sm text-slate-600">
                          创建一个新的知识库来管理您的文档
                        </p>
                      </div>
                    </div>
                  </ModalHeader>
                  <ModalBody>
                    <div className="space-y-5 py-4">
                      <div className="space-y-2.5">
                        <label htmlFor="name" className="text-sm font-semibold text-slate-700">
                          知识库名称 <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id="name"
                          placeholder="请输入知识库名称"
                          value={newKbName}
                          onValueChange={setNewKbName}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newKbName.trim()) {
                              createKnowledgeBase();
                            }
                          }}
                          className="rounded-xl"
                        />
                        <p className="text-xs text-slate-500">
                          知识库名称用于标识和管理您的文档集合
                        </p>
                      </div>
                      <div className="space-y-2.5">
                        <label htmlFor="description" className="text-sm font-semibold text-slate-700">
                          描述 <span className="text-slate-400 text-xs font-normal">（可选）</span>
                        </label>
                        <Textarea
                          id="description"
                          placeholder="请输入知识库的描述信息，帮助您更好地识别和管理"
                          value={newKbDescription}
                          onValueChange={setNewKbDescription}
                          minRows={3}
                          className="rounded-xl"
                        />
                        <p className="text-xs text-slate-500">
                          添加描述可以帮助您更好地组织和识别知识库
                        </p>
                      </div>
                    </div>
                  </ModalBody>
                  <ModalFooter>
                    <Button 
                      variant="light" 
                      onPress={() => setIsCreateDialogOpen(false)}
                      className="rounded-xl"
                    >
                      取消
                    </Button>
                    <Button 
                      onPress={createKnowledgeBase}
                      isDisabled={!newKbName.trim()}
                      color="primary"
                      startContent={<Plus className="h-4 w-4" />}
                      className="rounded-xl"
                    >
                      创建知识库
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>

              <Button 
                className="w-full gap-2 bg-gradient-to-br from-purple-700 to-purple-800 text-white hover:from-purple-800 hover:to-purple-900 shadow-md mb-4 rounded-xl transition-all duration-200 hover:shadow-lg"
                onPress={() => setIsCreateDialogOpen(true)}
                startContent={<Plus className="h-4 w-4" />}
              >
                创建知识库
              </Button>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">知识库列表</label>
                <div className="space-y-2">
                  {knowledgeBases.map((kb) => (
                    <Card
                      key={kb.id}
                      className={`cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md rounded-xl ${
                        selectedKbId === kb.id 
                          ? "border-2 border-blue-600 bg-blue-100 shadow-md" 
                          : "border border-slate-200 hover:border-blue-400 bg-white"
                      }`}
                      isPressable
                      onPress={() => setSelectedKbId(kb.id)}
                    >
                      <CardBody className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`text-base font-semibold ${selectedKbId === kb.id ? "text-blue-800" : "text-slate-800"}`}>{kb.name}</h3>
                            <p className="text-xs mt-1 flex items-center gap-1 text-gray-600">
                              <FileText className="h-3 w-3" />
                              {kb.doc_count} 个文档
                            </p>
                          </div>
                          <Button
                            variant="light"
                            size="sm"
                            isIconOnly
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600 transition-colors rounded-lg"
                            onPress={() => {
                              deleteKnowledgeBase(kb.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
              )}
            </div>
          </Tabs>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col bg-white">
        {activeTab === "chat" ? (
          <>
            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-soft">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-md">
                      <MessageCircle className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-slate-600 font-medium">开始对话吧！选择一个知识库后输入您的问题。</p>
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <Card className={`max-w-3xl shadow-elegant rounded-2xl ${
                    msg.role === "user" 
                      ? "bg-gradient-to-br from-blue-700 to-blue-800 text-white border-0" 
                      : "bg-white border-slate-200"
                  }`}>
                    <CardBody className="p-5">
                      {msg.role === "assistant" && !msg.content && isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-gray-600">正在思考...</span>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </div>
                      )}
                    </CardBody>
                  </Card>
                  {/* 显示来源文档下载按钮（只显示匹配度最高的一个文档，确保有且只有一个） */}
                  {msg.role === "assistant" && 
                   msg.documents && 
                   Array.isArray(msg.documents) && 
                   msg.documents.length === 1 && 
                   msg.documents[0]?.id && (
                    <div className="mt-3">
                      <Button
                        variant="bordered"
                        size="sm"
                        className="text-xs bg-white border-blue-300 text-blue-800 hover:bg-blue-100 hover:border-blue-400 shadow-sm rounded-lg"
                        onPress={async () => {
                          try {
                            // 确保只取第一个文档（匹配度最高的，且是问答中实际使用的）
                            const doc = msg.documents![0];
                            
                            // 验证文档信息
                            if (!doc || !doc.id) {
                              throw new Error("文档信息无效");
                            }
                            
                            console.log("开始下载文档:", doc);
                            
                            const response = await fetch(`${API_BASE_URL}/document/download`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: doc.id }),
                            });
                            
                            if (!response.ok) {
                              const errorText = await response.text();
                              throw new Error(`下载失败: ${response.status} ${response.statusText} - ${errorText}`);
                            }
                            
                            // 获取blob并下载
                            const blob = await response.blob();
                            
                            // 验证blob是否有效
                            if (!blob || blob.size === 0) {
                              throw new Error("下载的文件为空");
                            }
                            
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            // 使用文档名称，如果没有则使用默认名称
                            const filename = doc.name || `文档_${doc.id}.pdf`;
                            a.download = filename;
                            document.body.appendChild(a);
                            a.click();
                            
                            // 清理
                            setTimeout(() => {
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            }, 100);
                            
                            console.log("文档下载成功:", filename);
                          } catch (error) {
                            console.error("下载文档失败:", error);
                            const errorMessage = error instanceof Error ? error.message : "下载文档失败，请稍后重试";
                            alert(errorMessage);
                          }
                        }}
                      >
                        <Download className="h-3 w-3 mr-1.5" />
                        {msg.documents[0].name || `文档_${msg.documents[0].id}`}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              {/* 滚动锚点 */}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入框 */}
            <div className="border-t border-slate-200/80 bg-white p-6 shadow-soft">
              <div className="flex gap-3 max-w-6xl mx-auto">
                <Input
                  value={inputMessage}
                  onValueChange={setInputMessage}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="输入您的问题..."
                  isDisabled={isLoading || !selectedKbId}
                  className="flex-1 h-16 text-base border-slate-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 bg-white rounded-2xl"
                />
                <Button
                  onPress={sendMessage}
                  isDisabled={isLoading || !selectedKbId}
                  isIconOnly
                  size="lg"
                  className="h-16 w-16 bg-gradient-to-br from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white shadow-md rounded-2xl transition-all duration-200 hover:scale-105"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-6">
            {selectedKbId ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 rounded-2xl bg-white border border-slate-200 shadow-elegant">
                  <div>
                    <h2 className="text-2xl font-bold text-blue-700">
                      {knowledgeBases.find((kb) => kb.id === selectedKbId)?.name}
                    </h2>
                    <p className="text-slate-600 mt-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {knowledgeBases.find((kb) => kb.id === selectedKbId)?.description || "暂无描述"}
                    </p>
                  </div>
                  <label>
                    <Button asChild variant="outline" className="bg-gradient-to-br from-blue-700 to-blue-800 text-white hover:from-blue-800 hover:to-blue-900 border-0 shadow-md rounded-xl transition-all duration-200 hover:shadow-lg">
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        上传文档
                      </span>
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          uploadDocument(file, selectedKbId);
                        }
                      }}
                    />
                  </label>
                </div>

                <Divider className="bg-slate-200" />

                <div className="space-y-3">
                  {documents.length === 0 ? (
                    <Card className="border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl">
                      <CardBody className="p-12 text-center">
                        <div className="p-4 rounded-2xl bg-blue-200 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <FileText className="h-8 w-8 text-blue-700" />
                        </div>
                        <p className="text-slate-600 font-medium">暂无文档，请上传文档</p>
                      </CardBody>
                    </Card>
                  ) : (
                    documents.map((doc) => (
                      <Card key={doc.id} className="shadow-elegant hover:shadow-md transition-shadow border-slate-200 rounded-xl">
                        <CardBody>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 rounded-xl bg-blue-200">
                                  <FileText className="h-5 w-5 text-blue-700" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-800">{doc.name}</h3>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-600 ml-9">
                                <span className="px-2 py-0.5 rounded-lg bg-slate-100">{doc.file_type}</span>
                                <span>{(doc.file_size / 1024).toFixed(2)} KB</span>
                                <span>{doc.chunk_count} 个分块</span>
                                {getStatusBadge(doc.status)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {doc.status === "pending" && (
                                <Button
                                  variant="bordered"
                                  size="sm"
                                  onPress={() => startParseDocument(doc.id)}
                                  isDisabled={parsingDocId === doc.id}
                                  className="bg-gradient-to-br from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 border-0 shadow-sm rounded-lg transition-all duration-200"
                                  startContent={parsingDocId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                >
                                  {parsingDocId === doc.id ? "解析中..." : "开始解析"}
                                </Button>
                              )}
                              {doc.status === "failed" && (
                                <Button
                                  variant="bordered"
                                  size="sm"
                                  onPress={() => startParseDocument(doc.id)}
                                  isDisabled={parsingDocId === doc.id}
                                  className="bg-gradient-to-br from-orange-600 to-orange-700 text-white hover:from-orange-700 hover:to-orange-800 border-0 shadow-sm rounded-lg transition-all duration-200"
                                  startContent={parsingDocId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                >
                                  {parsingDocId === doc.id ? "解析中..." : "重新解析"}
                                </Button>
                              )}
                              {doc.status === "completed" && (
                                <Button
                                  variant="bordered"
                                  size="sm"
                                  onPress={() => reparseDocument(doc.id)}
                                  isDisabled={parsingDocId === doc.id}
                                  className="bg-gradient-to-br from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 border-0 shadow-sm rounded-lg transition-all duration-200"
                                  startContent={parsingDocId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                >
                                  {parsingDocId === doc.id ? "重新解析中..." : "重新解析"}
                                </Button>
                              )}
                              {doc.status === "processing" && (
                                <div className="flex items-center gap-2 text-sm text-blue-700 px-3 py-1.5 rounded-xl bg-blue-100">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span>解析中...</span>
                                </div>
                              )}
                              <Button
                                variant="light"
                                size="sm"
                                isIconOnly
                                onPress={() => deleteDocument(doc.id)}
                                className="hover:bg-red-50 hover:text-red-600 transition-colors rounded-lg"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <Card className="border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl">
                <CardBody className="p-12 text-center">
                  <div className="p-4 rounded-2xl bg-indigo-200 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-indigo-700" />
                  </div>
                  <p className="text-slate-600 font-medium">请先选择一个知识库</p>
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
