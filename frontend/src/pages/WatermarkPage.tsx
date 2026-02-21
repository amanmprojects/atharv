import { useState } from 'react'
import { Fingerprint, Loader2, Shield, Lock, Unlock, FileCheck, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { embedWatermark, detectWatermark, getStylometricSignature } from '@/lib/api'
import type { WatermarkEmbedResponse, WatermarkDetectResponse, StylometricSignature } from '@/types'

export default function WatermarkPage() {
    const [text, setText] = useState('')
    const [watermarkId, setWatermarkId] = useState('')
    const [embedResult, setEmbedResult] = useState<WatermarkEmbedResponse | null>(null)
    const [detectResult, setDetectResult] = useState<WatermarkDetectResponse | null>(null)
    const [signature, setSignature] = useState<StylometricSignature | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [activeTab, setActiveTab] = useState('embed')
    const { toast } = useToast()

    const handleEmbed = async () => {
        if (!text.trim()) return
        setIsProcessing(true)
        try {
            const data = await embedWatermark(text, watermarkId || undefined)
            setEmbedResult(data)
            toast({ title: 'Watermark Embedded', description: `ID: ${data.watermark_id}, ${data.modifications_made} modifications` })
        } catch {
            toast({ title: 'Error', description: 'Failed to embed watermark.', variant: 'destructive' })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleDetect = async () => {
        if (!text.trim()) return
        setIsProcessing(true)
        try {
            const data = await detectWatermark(text)
            setDetectResult(data)
            toast({ title: data.watermark_detected ? 'Watermark Found!' : 'No Watermark Detected' })
        } catch {
            toast({ title: 'Error', description: 'Detection failed.', variant: 'destructive' })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleSignature = async () => {
        if (!text.trim()) return
        setIsProcessing(true)
        try {
            const data = await getStylometricSignature(text)
            setSignature(data)
            toast({ title: 'Signature Generated', description: `Hash: ${data.signature_hash}` })
        } catch {
            toast({ title: 'Error', description: 'Signature failed.', variant: 'destructive' })
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="p-6 lg:p-12 max-w-7xl mx-auto space-y-8">
            <div className="pb-6 border-b-4 border-foreground">
                <h1 className="text-5xl md:text-6xl font-heading font-black tracking-tighter uppercase leading-none flex items-center gap-4">
                    <Fingerprint className="h-10 w-10 text-primary" strokeWidth={3} />
                    Watermarking
                </h1>
                <p className="text-muted-foreground font-mono text-sm mt-3 uppercase tracking-widest">
                    Stylometric signatures for authorship verification
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6 bg-background border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))]">
                    <TabsTrigger value="embed" className="font-black uppercase text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Lock className="h-4 w-4 mr-2" />Embed
                    </TabsTrigger>
                    <TabsTrigger value="detect" className="font-black uppercase text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Eye className="h-4 w-4 mr-2" />Detect
                    </TabsTrigger>
                    <TabsTrigger value="signature" className="font-black uppercase text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <FileCheck className="h-4 w-4 mr-2" />Signature
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="embed">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <Textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Paste text to embed a watermark..."
                                className="h-64 resize-none border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))]"
                            />
                            <div className="flex gap-4">
                                <Input
                                    value={watermarkId}
                                    onChange={(e) => setWatermarkId(e.target.value)}
                                    placeholder="Custom watermark ID (optional)..."
                                    className="flex-1 border-2 border-foreground shadow-[2px_2px_0_0_hsl(var(--foreground))]"
                                />
                                <Button onClick={handleEmbed} disabled={isProcessing}
                                    className="bg-primary text-primary-foreground px-6 font-black uppercase border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] transition-all rounded-none">
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                                    Embed
                                </Button>
                            </div>
                        </div>

                        {embedResult && (
                            <div className="space-y-4">
                                <div className="bg-card border-4 border-foreground p-6 shadow-[8px_8px_0_0_hsl(var(--foreground))]">
                                    <h3 className="font-black uppercase text-sm tracking-tight mb-4">Watermark Result</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold">Watermark ID</span>
                                            <span className="font-mono text-primary">{embedResult.watermark_id}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold">Bits Encoded</span>
                                            <span className="font-mono">{embedResult.bits_encoded} / {embedResult.bits_total}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold">Modifications</span>
                                            <span className="font-mono">{embedResult.modifications_made}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold">Success Rate</span>
                                            <span className="font-mono text-green-500">{embedResult.encoding_success_rate}%</span>
                                        </div>
                                        <Progress value={embedResult.encoding_success_rate} className="h-3" />
                                    </div>
                                </div>
                                <div className="bg-muted p-4 border-2 border-foreground/20 max-h-48 overflow-auto scrollbar-thin">
                                    <p className="text-xs font-mono whitespace-pre-wrap">{embedResult.watermarked_text}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="detect">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <Textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Paste text to detect watermark..."
                                className="h-64 resize-none border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))]"
                            />
                            <Button onClick={handleDetect} disabled={isProcessing}
                                className="bg-foreground text-background px-8 font-black uppercase shadow-[4px_4px_0_0_hsl(var(--primary))] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_hsl(var(--primary))] transition-all rounded-none">
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
                                Detect Watermark
                            </Button>
                        </div>

                        {detectResult && (
                            <div className="bg-card border-4 border-foreground p-6 shadow-[8px_8px_0_0_hsl(var(--foreground))]">
                                <div className={`flex items-center gap-3 mb-4 p-4 ${detectResult.watermark_detected ? 'bg-green-500/10 border-2 border-green-500' : 'bg-red-500/10 border-2 border-red-500'}`}>
                                    <Shield className={`h-6 w-6 ${detectResult.watermark_detected ? 'text-green-500' : 'text-red-500'}`} />
                                    <span className="font-black uppercase">
                                        {detectResult.watermark_detected ? 'Watermark Detected!' : 'No Watermark Found'}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold">Confidence</span>
                                        <span className="font-mono">{detectResult.confidence}%</span>
                                    </div>
                                    <Progress value={detectResult.confidence} className="h-3" />
                                    <div className="flex justify-between text-sm">
                                        <span className="font-bold">Bits Detected</span>
                                        <span className="font-mono">{detectResult.bits_detected}</span>
                                    </div>
                                    {detectResult.decoded_id && (
                                        <div className="flex justify-between text-sm">
                                            <span className="font-bold">Decoded ID</span>
                                            <span className="font-mono text-primary">{detectResult.decoded_id}</span>
                                        </div>
                                    )}
                                </div>
                                {detectResult.evidence.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="text-xs font-black uppercase mb-2">Evidence</h4>
                                        <div className="space-y-1">
                                            {detectResult.evidence.map((e, i) => (
                                                <p key={i} className="text-xs text-muted-foreground bg-muted p-2">{e}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="signature">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <Textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Paste text to generate stylometric signature..."
                                className="h-64 resize-none border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))]"
                            />
                            <Button onClick={handleSignature} disabled={isProcessing}
                                className="bg-primary text-primary-foreground px-8 font-black uppercase border-2 border-foreground shadow-[4px_4px_0_0_hsl(var(--foreground))] hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] transition-all rounded-none">
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileCheck className="h-4 w-4 mr-2" />}
                                Generate Signature
                            </Button>
                        </div>

                        {signature && (
                            <div className="bg-card border-4 border-foreground p-6 shadow-[8px_8px_0_0_hsl(var(--foreground))]">
                                <h3 className="font-black uppercase text-sm tracking-tight mb-4">Stylometric Signature</h3>
                                <div className="p-3 bg-primary/10 border-2 border-primary mb-4 font-mono text-sm break-all">
                                    {signature.signature_hash}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-muted">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Avg Word Length</p>
                                        <p className="text-xl font-black">{signature.avg_word_length}</p>
                                    </div>
                                    <div className="p-3 bg-muted">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Avg Sentence Length</p>
                                        <p className="text-xl font-black">{signature.avg_sentence_length}</p>
                                    </div>
                                    <div className="p-3 bg-muted">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Vocab Richness</p>
                                        <p className="text-xl font-black">{(signature.vocabulary_richness * 100).toFixed(1)}%</p>
                                    </div>
                                    <div className="p-3 bg-muted">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Hapax Ratio</p>
                                        <p className="text-xl font-black">{(signature.hapax_legomena_ratio * 100).toFixed(1)}%</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
