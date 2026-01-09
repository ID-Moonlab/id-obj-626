'use client'

import { useState, useMemo } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { generateVirtualSatelliteData } from "@/lib/virtualDataGenerators"
import { validateSatelliteData } from "@/lib/validators"
import { SatelliteData } from "@/types"

interface SatelliteDataStepProps {
  companyNumber: string
  data: SatelliteData[]
  onDataChange: (data: SatelliteData[]) => void
  onNext: () => void
  onPrevious: () => void
}

export default function SatelliteDataStep({
  companyNumber,
  data,
  onDataChange,
  onNext,
  onPrevious,
}: SatelliteDataStepProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  // 计算分页数据
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return data.slice(startIndex, endIndex)
  }, [data, currentPage, pageSize])

  const totalPages = Math.ceil(data.length / pageSize)

  // 当数据变化时，重置到第一页
  useMemo(() => {
    if (data.length > 0 && currentPage > totalPages) {
      setCurrentPage(1)
    }
  }, [data.length, totalPages])

  const handleGenerateVirtualData = () => {
    if (!companyNumber) {
      alert("请先完成企业信息填写")
      return
    }

    const virtualData = generateVirtualSatelliteData(companyNumber, 39.9, 116.4, 800)
    onDataChange(virtualData)
    setErrors([])
    setWarnings([])
    alert(`成功生成${virtualData.length}条虚拟卫星观测数据`)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      // TODO: 使用 xlsx 库解析 Excel 文件
      alert("Excel 导入功能即将实现")
    } catch (error) {
      alert("文件解析失败")
      console.error(error)
    }
  }

  // 更新单条数据
  const handleDataChange = (globalIndex: number, field: keyof SatelliteData, value: string | number) => {
    if (globalIndex < 0 || globalIndex >= data.length) {
      return
    }
    
    const newData = data.map((item, idx) => {
      if (idx !== globalIndex) {
        return item
      }
      
      // 创建新对象，避免直接修改原对象
      const updatedItem = { ...item }
      
      // 更新字段值
      if (field === 'f_observation_date' || field === 'f_observation_time') {
        updatedItem[field] = value as string
      } else if (field === 'f_latitude' || field === 'f_longitude' || field === 'f_CO2_concentration') {
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
        updatedItem[field] = numValue as any
      }
      
      return updatedItem
    })
    
    onDataChange(newData)
  }

  const handleNext = () => {
    if (data.length === 0) {
      setErrors(["请先导入或生成卫星观测数据"])
      return
    }

    const validation = validateSatelliteData(data)
    if (!validation.valid) {
      setErrors(validation.errors)
      setWarnings(validation.warnings || [])
      return
    }

    setErrors([])
    setWarnings(validation.warnings || [])
    onNext()
  }

  const getStatistics = () => {
    if (data.length === 0) return null

    const latitudes = data.map((d) => d.f_latitude)
    const longitudes = data.map((d) => d.f_longitude)
    const concentrations = data.map((d) => d.f_CO2_concentration)

    return {
      count: data.length,
      latRange: {
        min: Math.min(...latitudes).toFixed(6),
        max: Math.max(...latitudes).toFixed(6),
      },
      lonRange: {
        min: Math.min(...longitudes).toFixed(6),
        max: Math.max(...longitudes).toFixed(6),
      },
      CO2Range: {
        min: Math.min(...concentrations).toFixed(2),
        max: Math.max(...concentrations).toFixed(2),
        avg: (concentrations.reduce((a, b) => a + b, 0) / concentrations.length).toFixed(2),
      },
    }
  }

  const stats = getStatistics()

  return (
    <Card>
      <CardHeader>
        <CardTitle>卫星观测点数据</CardTitle>
        <CardDescription>导入或生成800+条卫星观测数据，用于监测企业周边CO₂浓度</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-4 rounded-lg border-2 border-dashed p-6">
            <div>
              <h3 className="mb-2 font-medium">生成虚拟数据</h3>
              <p className="mb-4 text-sm text-muted-foreground">点击按钮自动生成800条虚拟卫星观测数据用于演示</p>
              <Button onClick={handleGenerateVirtualData} variant="outline" className="w-full">
                生成800条虚拟数据
              </Button>
            </div>
          </div>

          <div className="space-y-4 rounded-lg border-2 border-dashed p-6">
            <div>
              <h3 className="mb-2 font-medium">Excel 文件导入</h3>
              <p className="mb-4 text-sm text-muted-foreground">上传包含卫星观测数据的 Excel 文件（*.xlsx）</p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:rounded file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
          </div>
        </div>

        {stats && (
          <div className="space-y-4">
            <div className="rounded-md bg-secondary/50 p-4">
              <h4 className="mb-3 font-medium">已导入数据概览</h4>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">观测点数量：</span>
                  <span className="ml-2 font-medium">{stats.count} 个</span>
                </div>
                <div>
                  <span className="text-muted-foreground">平均CO₂浓度：</span>
                  <span className="ml-2 font-medium">{stats.CO2Range.avg} ppm</span>
                </div>
                <div>
                  <span className="text-muted-foreground">纬度范围：</span>
                  <span className="ml-2 font-medium">
                    {stats.latRange.min} ~ {stats.latRange.max}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">经度范围：</span>
                  <span className="ml-2 font-medium">
                    {stats.lonRange.min} ~ {stats.lonRange.max}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">CO₂浓度范围：</span>
                  <span className="ml-2 font-medium">
                    {stats.CO2Range.min} ~ {stats.CO2Range.max} ppm
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-md border">
              <div className="flex items-center justify-between border-b bg-muted/50 p-3">
                <h4 className="font-medium">数据预览（全部数据）</h4>
                <span className="text-sm text-muted-foreground">
                  显示 {data.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, data.length)} / {data.length}
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">观测日期</TableHead>
                      <TableHead className="text-right">纬度</TableHead>
                      <TableHead className="text-right">经度</TableHead>
                      <TableHead className="text-right">CO₂浓度</TableHead>
                      <TableHead className="w-24">观测时间</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((item, index) => {
                      const globalIndex = (currentPage - 1) * pageSize + index
                      // 使用更稳定的 key，结合日期和索引
                      const rowKey = item.f_observation_date ? `${item.f_observation_date}-${globalIndex}` : `row-${globalIndex}`
                      return (
                        <TableRow key={rowKey} className="hover:bg-muted/50">
                          <TableCell className="p-1">
                            <Input
                              type="date"
                              value={item.f_observation_date || ''}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleDataChange(globalIndex, 'f_observation_date', e.target.value)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 text-xs font-mono w-full cursor-text"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              type="number"
                              step="0.000001"
                              value={item.f_latitude !== undefined && item.f_latitude !== null ? item.f_latitude : ''}
                              onChange={(e) => {
                                e.stopPropagation()
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                handleDataChange(globalIndex, 'f_latitude', val)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              className="h-8 text-xs font-mono text-right w-full cursor-text"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              type="number"
                              step="0.000001"
                              value={item.f_longitude !== undefined && item.f_longitude !== null ? item.f_longitude : ''}
                              onChange={(e) => {
                                e.stopPropagation()
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                handleDataChange(globalIndex, 'f_longitude', val)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              className="h-8 text-xs font-mono text-right w-full cursor-text"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.f_CO2_concentration !== undefined && item.f_CO2_concentration !== null ? item.f_CO2_concentration : ''}
                              onChange={(e) => {
                                e.stopPropagation()
                                const val = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                                handleDataChange(globalIndex, 'f_CO2_concentration', val)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              className="h-8 text-xs font-mono text-right font-medium w-full cursor-text"
                            />
                          </TableCell>
                          <TableCell className="p-1">
                            <Input
                              type="time"
                              value={item.f_observation_time || ''}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleDataChange(globalIndex, 'f_observation_time', e.target.value)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 text-xs font-mono w-full cursor-text"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  pageSize={pageSize}
                  total={data.length}
                />
              )}
            </div>
          </div>
        )}

        <div className="rounded-md bg-blue-100 p-4 text-blue-900">
          <h4 className="mb-2 font-medium">数据要求</h4>
          <ul className="list-inside list-disc space-y-1 text-sm">
            <li>至少需要800个卫星观测点数据</li>
            <li>每个观测点需包含：观测日期、经纬度、CO₂浓度</li>
            <li>纬度范围：-90 到 90 度</li>
            <li>经度范围：-180 到 180 度</li>
            <li>CO₂浓度范围：0 到 1000 ppm</li>
          </ul>
        </div>

        {warnings.length > 0 && (
          <div className="rounded-md bg-yellow-100 p-4 text-yellow-900">
            <p className="mb-2 font-medium">警告：</p>
            <ul className="list-inside list-disc space-y-1">
              {warnings.map((warning, index) => (
                <li key={index} className="text-sm">
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {errors.length > 0 && (
          <div className="rounded-md bg-destructive/10 p-4 text-destructive">
            <p className="mb-2 font-medium">请修正以下错误：</p>
            <ul className="list-inside list-disc space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={onPrevious} variant="outline">
          上一步
        </Button>
        <Button onClick={handleNext}>下一步</Button>
      </CardFooter>
    </Card>
  )
}

