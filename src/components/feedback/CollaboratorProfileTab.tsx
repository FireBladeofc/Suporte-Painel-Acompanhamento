 import { useState, useEffect } from 'react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Badge } from '@/components/ui/badge';
 import { Slider } from '@/components/ui/slider';
 import { Collaborator, AttentionFlagStatus } from '@/types/feedback';
 import { useCollaboratorProfile } from '@/hooks/useCollaboratorProfile';
 import { AddWarningModal } from './AddWarningModal';
 import { AddAttentionFlagModal } from './AddAttentionFlagModal';
 import {
   Clock,
   Star,
   MessageSquare,
   AlertTriangle,
   AlertCircle,
   Plus,
   Save,
   Trash2,
   CheckCircle2,
   Eye,
   Loader2,
   X,
 } from 'lucide-react';
 import { format } from 'date-fns';
 import { ptBR } from 'date-fns/locale';
 import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
 } from '@/components/ui/alert-dialog';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { Textarea } from '@/components/ui/textarea';
 
 interface CollaboratorProfileTabProps {
   collaborator: Collaborator;
 }
 
 export function CollaboratorProfileTab({ collaborator }: CollaboratorProfileTabProps) {
   const {
     profile,
     warnings,
     attentionFlags,
     loading,
     upsertProfile,
     addWarning,
     deleteWarning,
     addAttentionFlag,
     updateAttentionFlag,
     deleteAttentionFlag,
   } = useCollaboratorProfile(collaborator.id);
 
   const [startTime, setStartTime] = useState(profile?.work_start_time || '08:00');
   const [endTime, setEndTime] = useState(profile?.work_end_time || '17:00');
   const [technicalLevel, setTechnicalLevel] = useState(profile?.technical_level || 3);
   const [communicationLevel, setCommunicationLevel] = useState(profile?.communication_level || 3);
   const [difficulties, setDifficulties] = useState<string[]>(profile?.main_difficulties || []);
   const [newDifficulty, setNewDifficulty] = useState('');
   const [saving, setSaving] = useState(false);
 
   const [warningModalOpen, setWarningModalOpen] = useState(false);
   const [flagModalOpen, setFlagModalOpen] = useState(false);
 
    // Sync state when profile loads
    useEffect(() => {
      if (profile) {
        setStartTime(profile.work_start_time || '08:00');
        setEndTime(profile.work_end_time || '17:00');
        setTechnicalLevel(profile.technical_level || 3);
        setCommunicationLevel(profile.communication_level || 3);
        setDifficulties(profile.main_difficulties || []);
      }
    }, [profile]);
 
   const handleSaveProfile = async () => {
     setSaving(true);
     await upsertProfile({
       work_start_time: startTime,
       work_end_time: endTime,
       technical_level: technicalLevel,
       communication_level: communicationLevel,
       main_difficulties: difficulties,
     });
     setSaving(false);
   };
 
   const addDifficulty = () => {
     if (newDifficulty.trim() && !difficulties.includes(newDifficulty.trim())) {
       setDifficulties([...difficulties, newDifficulty.trim()]);
       setNewDifficulty('');
     }
   };
 
   const removeDifficulty = (diff: string) => {
     setDifficulties(difficulties.filter(d => d !== diff));
   };
 
   const renderStars = (level: number) => {
     return Array.from({ length: 5 }, (_, i) => (
       <Star
         key={i}
         className={`w-5 h-5 ${i < level ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`}
       />
     ));
   };
 
   const getWarningTypeLabel = (type: string) => {
     switch (type) {
       case 'verbal': return 'Verbal';
       case 'escrita': return 'Escrita';
       case 'suspensao': return 'Suspensão';
       default: return type;
     }
   };
 
   const getWarningTypeColor = (type: string) => {
     switch (type) {
       case 'verbal': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
       case 'escrita': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
       case 'suspensao': return 'bg-red-500/20 text-red-400 border-red-500/30';
       default: return '';
     }
   };
 
   const getSeverityColor = (severity: string) => {
     switch (severity) {
       case 'baixa': return 'bg-green-500/20 text-green-400 border-green-500/30';
       case 'media': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
       case 'alta': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
       case 'critica': return 'bg-red-500/20 text-red-400 border-red-500/30';
       default: return '';
     }
   };
 
   const getSeverityEmoji = (severity: string) => {
     switch (severity) {
       case 'baixa': return '🟢';
       case 'media': return '🟡';
       case 'alta': return '🟠';
       case 'critica': return '🔴';
       default: return '⚪';
     }
   };
 
   const getStatusIcon = (status: string) => {
     switch (status) {
       case 'ativo': return <AlertCircle className="w-4 h-4 text-red-400" />;
       case 'resolvido': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
       case 'monitorando': return <Eye className="w-4 h-4 text-yellow-400" />;
       default: return null;
     }
   };
 
   if (loading) {
     return (
       <div className="flex items-center justify-center py-12">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       {/* Horários de Trabalho */}
       <Card className="bg-card/50 border-border/50">
         <CardHeader className="pb-3">
           <CardTitle className="text-lg flex items-center gap-2">
             <Clock className="w-5 h-5 text-primary" />
             Horários de Trabalho
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label htmlFor="start-time">Entrada</Label>
               <Input
                 id="start-time"
                 type="time"
                 value={startTime}
                 onChange={(e) => setStartTime(e.target.value)}
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="end-time">Saída</Label>
               <Input
                 id="end-time"
                 type="time"
                 value={endTime}
                 onChange={(e) => setEndTime(e.target.value)}
               />
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Avaliações do Gestor */}
       <Card className="bg-card/50 border-border/50">
         <CardHeader className="pb-3">
           <CardTitle className="text-lg flex items-center gap-2">
             <Star className="w-5 h-5 text-primary" />
             Avaliações do Gestor
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-6">
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <Label className="flex items-center gap-2">
                 Nível Técnico
               </Label>
               <div className="flex items-center gap-1">
                 {renderStars(technicalLevel)}
                 <span className="ml-2 text-sm text-muted-foreground">({technicalLevel}/5)</span>
               </div>
             </div>
             <Slider
               value={[technicalLevel]}
               onValueChange={([v]) => setTechnicalLevel(v)}
               min={1}
               max={5}
               step={1}
               className="w-full"
             />
           </div>
 
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <Label className="flex items-center gap-2">
                 <MessageSquare className="w-4 h-4" />
                 Nível de Comunicação
               </Label>
               <div className="flex items-center gap-1">
                 {renderStars(communicationLevel)}
                 <span className="ml-2 text-sm text-muted-foreground">({communicationLevel}/5)</span>
               </div>
             </div>
             <Slider
               value={[communicationLevel]}
               onValueChange={([v]) => setCommunicationLevel(v)}
               min={1}
               max={5}
               step={1}
               className="w-full"
             />
           </div>
 
           <div className="space-y-3">
             <Label>Principais Dificuldades</Label>
             <div className="flex flex-wrap gap-2 mb-2">
               {difficulties.map((diff, i) => (
                 <Badge key={i} variant="secondary" className="gap-1">
                   {diff}
                   <button onClick={() => removeDifficulty(diff)} className="ml-1 hover:text-destructive">
                     <X className="w-3 h-3" />
                   </button>
                 </Badge>
               ))}
             </div>
             <div className="flex gap-2">
               <Input
                 placeholder="Adicionar dificuldade..."
                 value={newDifficulty}
                 onChange={(e) => setNewDifficulty(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && addDifficulty()}
               />
               <Button variant="outline" size="icon" onClick={addDifficulty}>
                 <Plus className="w-4 h-4" />
               </Button>
             </div>
           </div>
 
           <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
             {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
             Salvar Perfil
           </Button>
         </CardContent>
       </Card>
 
       {/* Advertências */}
       <Card className="bg-card/50 border-border/50">
         <CardHeader className="pb-3">
           <div className="flex items-center justify-between">
             <CardTitle className="text-lg flex items-center gap-2">
               <AlertTriangle className="w-5 h-5 text-orange-400" />
               Advertências
               {warnings.length > 0 && (
                 <Badge variant="secondary">{warnings.length}</Badge>
               )}
             </CardTitle>
             <Button size="sm" onClick={() => setWarningModalOpen(true)}>
               <Plus className="w-4 h-4 mr-1" />
               Adicionar
             </Button>
           </div>
         </CardHeader>
         <CardContent>
           {warnings.length === 0 ? (
             <p className="text-sm text-muted-foreground text-center py-4">
               Nenhuma advertência registrada
             </p>
           ) : (
             <div className="space-y-3">
               {warnings.map((warning) => (
                 <div
                   key={warning.id}
                   className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2"
                 >
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <Badge className={getWarningTypeColor(warning.type)}>
                         {getWarningTypeLabel(warning.type)}
                       </Badge>
                       <span className="text-sm text-muted-foreground">
                         {format(new Date(warning.warning_date), "dd/MM/yyyy", { locale: ptBR })}
                       </span>
                     </div>
                     <AlertDialog>
                       <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                         <AlertDialogHeader>
                           <AlertDialogTitle>Excluir advertência?</AlertDialogTitle>
                           <AlertDialogDescription>
                             Esta ação não pode ser desfeita.
                           </AlertDialogDescription>
                         </AlertDialogHeader>
                         <AlertDialogFooter>
                           <AlertDialogCancel>Cancelar</AlertDialogCancel>
                           <AlertDialogAction
                             className="bg-destructive hover:bg-destructive/90"
                             onClick={() => deleteWarning(warning.id)}
                           >
                             Excluir
                           </AlertDialogAction>
                         </AlertDialogFooter>
                       </AlertDialogContent>
                     </AlertDialog>
                   </div>
                   <p className="text-sm font-medium">{warning.reason}</p>
                   {warning.details && (
                     <p className="text-xs text-muted-foreground">{warning.details}</p>
                   )}
                 </div>
               ))}
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* Sinais de Atenção */}
       <Card className="bg-card/50 border-border/50">
         <CardHeader className="pb-3">
           <div className="flex items-center justify-between">
             <CardTitle className="text-lg flex items-center gap-2">
               <AlertCircle className="w-5 h-5 text-red-400" />
               Sinais de Atenção
               {attentionFlags.filter(f => f.status === 'ativo').length > 0 && (
                 <Badge variant="destructive">
                   {attentionFlags.filter(f => f.status === 'ativo').length} ativo(s)
                 </Badge>
               )}
             </CardTitle>
             <Button size="sm" onClick={() => setFlagModalOpen(true)}>
               <Plus className="w-4 h-4 mr-1" />
               Adicionar
             </Button>
           </div>
         </CardHeader>
         <CardContent>
           {attentionFlags.length === 0 ? (
             <p className="text-sm text-muted-foreground text-center py-4">
               Nenhum sinal de atenção registrado
             </p>
           ) : (
             <div className="space-y-3">
               {attentionFlags.map((flag) => (
                 <AttentionFlagItem
                   key={flag.id}
                   flag={flag}
                   onUpdate={updateAttentionFlag}
                   onDelete={deleteAttentionFlag}
                   getSeverityColor={getSeverityColor}
                   getSeverityEmoji={getSeverityEmoji}
                   getStatusIcon={getStatusIcon}
                 />
               ))}
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* Modals */}
       <AddWarningModal
         open={warningModalOpen}
         onOpenChange={setWarningModalOpen}
         onSubmit={addWarning}
       />
       <AddAttentionFlagModal
         open={flagModalOpen}
         onOpenChange={setFlagModalOpen}
         onSubmit={addAttentionFlag}
       />
     </div>
   );
 }
 
 interface AttentionFlagItemProps {
   flag: {
     id: string;
     flag_date: string;
     severity: string;
     description: string;
     status: string;
     resolution_notes: string | null;
   };
   onUpdate: (id: string, data: { status: AttentionFlagStatus; resolution_notes?: string }) => Promise<boolean>;
   onDelete: (id: string) => Promise<boolean>;
   getSeverityColor: (s: string) => string;
   getSeverityEmoji: (s: string) => string;
   getStatusIcon: (s: string) => React.ReactNode;
 }
 
 function AttentionFlagItem({ 
   flag, 
   onUpdate, 
   onDelete,
   getSeverityColor,
   getSeverityEmoji,
   getStatusIcon 
 }: AttentionFlagItemProps) {
   const [editing, setEditing] = useState(false);
   const [status, setStatus] = useState<AttentionFlagStatus>(flag.status as AttentionFlagStatus);
   const [notes, setNotes] = useState(flag.resolution_notes || '');
   const [saving, setSaving] = useState(false);
 
   const handleSave = async () => {
     setSaving(true);
     const success = await onUpdate(flag.id, { status, resolution_notes: notes || undefined });
     setSaving(false);
     if (success) setEditing(false);
   };
 
   return (
     <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
       <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
           <span>{getSeverityEmoji(flag.severity)}</span>
           <Badge className={getSeverityColor(flag.severity)}>
             {flag.severity.charAt(0).toUpperCase() + flag.severity.slice(1)}
           </Badge>
           <span className="text-sm text-muted-foreground">
             {format(new Date(flag.flag_date), "dd/MM/yyyy", { locale: ptBR })}
           </span>
           {getStatusIcon(flag.status)}
         </div>
         <div className="flex items-center gap-1">
           {!editing && (
             <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => setEditing(true)}
               className="text-xs"
             >
               Atualizar
             </Button>
           )}
           <AlertDialog>
             <AlertDialogTrigger asChild>
               <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                 <Trash2 className="w-4 h-4" />
               </Button>
             </AlertDialogTrigger>
             <AlertDialogContent>
               <AlertDialogHeader>
                 <AlertDialogTitle>Excluir sinal de atenção?</AlertDialogTitle>
                 <AlertDialogDescription>
                   Esta ação não pode ser desfeita.
                 </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                 <AlertDialogCancel>Cancelar</AlertDialogCancel>
                 <AlertDialogAction
                   className="bg-destructive hover:bg-destructive/90"
                   onClick={() => onDelete(flag.id)}
                 >
                   Excluir
                 </AlertDialogAction>
               </AlertDialogFooter>
             </AlertDialogContent>
           </AlertDialog>
         </div>
       </div>
       <p className="text-sm">{flag.description}</p>
 
       {editing && (
         <div className="pt-2 space-y-3 border-t border-border/50">
           <div className="space-y-2">
             <Label>Status</Label>
             <Select value={status} onValueChange={(v) => setStatus(v as AttentionFlagStatus)}>
               <SelectTrigger>
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="ativo">🔴 Ativo</SelectItem>
                 <SelectItem value="monitorando">👁️ Monitorando</SelectItem>
                 <SelectItem value="resolvido">✅ Resolvido</SelectItem>
               </SelectContent>
             </Select>
           </div>
           <div className="space-y-2">
             <Label>Notas de Resolução</Label>
             <Textarea
               value={notes}
               onChange={(e) => setNotes(e.target.value)}
               placeholder="Descreva as ações tomadas..."
               rows={2}
             />
           </div>
           <div className="flex gap-2">
             <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
               Cancelar
             </Button>
             <Button size="sm" onClick={handleSave} disabled={saving}>
               {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
               Salvar
             </Button>
           </div>
         </div>
       )}
 
       {!editing && flag.resolution_notes && (
         <p className="text-xs text-muted-foreground italic">
           📝 {flag.resolution_notes}
         </p>
       )}
     </div>
   );
 }