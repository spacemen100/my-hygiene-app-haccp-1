import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { predefinedTasks, frequencyOptions } from './PredefinedTasksLibrary';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip,
  Avatar,
  Paper,
  Divider
} from '@mui/material';
import {
  CleaningServices,
  CheckCircle,
  Schedule,
  Category,
  Add as AddIcon
} from '@mui/icons-material';

interface Task {
  name: string;
  category: string;
  selected: boolean;
  customFrequency: string;
  isCustom?: boolean;
  defaultFrequency?: string;
}

interface CustomTask {
  name: string;
  frequency: string;
  customDays: number;
}

interface FrequencyOption {
  value: string;
  label: string;
}

const CleaningScheduler = () => {
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [customTask, setCustomTask] = useState<CustomTask>({
    name: '',
    frequency: 'daily',
    customDays: 1
  });
  const [daysToSchedule, setDaysToSchedule] = useState<number>(100);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Get available zones from predefined tasks
  const availableZones = Object.keys(predefinedTasks);

  // Handle zone selection
  const handleZoneSelect = (zone: string) => {
    setSelectedZone(zone);
    // Initialize selected tasks for this zone (all selected by default)
    const zoneTasks: Task[] = [];
    Object.entries(predefinedTasks[zone as keyof typeof predefinedTasks]).forEach(([category, tasks]) => {
      (tasks as unknown[]).forEach((task: unknown) => {
        const typedTask = task as { name: string; defaultFrequency: string };
        zoneTasks.push({
          ...typedTask,
          category,
          selected: true,
          customFrequency: typedTask.defaultFrequency
        });
      });
    });
    setSelectedTasks(zoneTasks);
  };

  // Toggle task selection
  const toggleTaskSelection = (index: number) => {
    const updatedTasks = [...selectedTasks];
    updatedTasks[index].selected = !updatedTasks[index].selected;
    setSelectedTasks(updatedTasks);
  };

  // Change frequency for a task
  const changeTaskFrequency = (index: number, frequency: string) => {
    const updatedTasks = [...selectedTasks];
    updatedTasks[index].customFrequency = frequency;
    setSelectedTasks(updatedTasks);
  };

  // Add custom task
  const addCustomTask = () => {
    if (customTask.name.trim() === '') return;
    
    setSelectedTasks([...selectedTasks, {
      name: customTask.name,
      category: "PERSONNALISÉ",
      selected: true,
      customFrequency: customTask.frequency,
      isCustom: true
    }]);
    
    setCustomTask({
      name: '',
      frequency: 'daily',
      customDays: 1
    });
  };

  // Submit all selected tasks
  const submitTasks = async () => {
    try {
      const tasksToSubmit = selectedTasks.filter(task => task.selected);
      
      if (tasksToSubmit.length === 0) {
        return;
      }

      // Create or find the zone UUID by name
      let zoneId = null;
      if (selectedZone) {
        // First try to find existing zone
        let { data: zoneData, error: zoneError } = await supabase
          .from('cleaning_zones')
          .select('id')
          .eq('name', selectedZone)
          .single();
        
        if (zoneError && zoneError.code === 'PGRST116') {
          // Zone doesn't exist, create it
          const { data: newZone, error: createError } = await supabase
            .from('cleaning_zones')
            .insert([{
              name: selectedZone,
              description: `Zone ${selectedZone} créée automatiquement`
            }])
            .select('id')
            .single();
          
          if (createError) {
            throw new Error(`Erreur lors de la création de la zone ${selectedZone}: ${createError.message}`);
          }
          
          zoneId = newZone.id;
        } else if (zoneError) {
          throw new Error(`Erreur lors de la recherche de la zone ${selectedZone}: ${zoneError.message}`);
        } else {
          zoneId = zoneData.id;
        }
      }

      // Create all tasks and their schedules
      for (const task of tasksToSubmit) {
        // First, create the base task
        const { data: createdTask, error: taskError } = await supabase
          .from('cleaning_tasks')
          .insert([{
            name: task.name,
            frequency: task.customFrequency,
            cleaning_zone_id: zoneId,
            action_to_perform: `Tâche ${task.name} - ${task.category}`,
            is_active: true
          }])
          .select();
        
        if (taskError) throw taskError;

        // Generate scheduled records for this task
        const recordsToInsert = generateScheduledRecords(
          createdTask[0].id, 
          task.customFrequency, 
          startDate, 
          daysToSchedule
        );

        // Insert all scheduled records
        if (recordsToInsert.length > 0) {
          const { error: recordsError } = await supabase
            .from('cleaning_records')
            .insert(recordsToInsert);
          
          if (recordsError) throw recordsError;
        }
      }

      // Success feedback
      alert(`Plan de nettoyage créé avec succès ! ${tasksToSubmit.length} tâches ont été programmées pour ${daysToSchedule} jours.`);
      
      // Reset form
      setSelectedZone('');
      setSelectedTasks([]);
      
    } catch (error) {
      console.error("Erreur lors de la création du plan:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert("Une erreur est survenue: " + errorMessage);
    }
  };

  // Helper function to generate scheduled records
  const generateScheduledRecords = (taskId: string, frequency: string, startDate: string, daysToSchedule: number) => {
    const records = [];
    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + daysToSchedule);
    let currentDate = new Date(start);

    while (currentDate <= endDate) {
      let shouldAdd = false;
      
      switch (frequency) {
        case 'after_each_use':
        case 'after_each_service':
          // These would typically be handled differently (triggered by events)
          break;
        case 'daily':
          shouldAdd = true;
          break;
        case 'weekly':
          if (currentDate.getDay() === start.getDay()) {
            shouldAdd = true;
          }
          break;
        case 'monthly':
          if (currentDate.getDate() === start.getDate()) {
            shouldAdd = true;
          }
          break;
        case 'custom':
          // Implement custom frequency logic if needed
          break;
      }

      if (shouldAdd) {
        records.push({
          cleaning_task_id: taskId,
          scheduled_date: currentDate.toISOString().split('T')[0],
          is_completed: false
        });
      }

      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return records;
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Zone Selection */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <CleaningServices />
            </Avatar>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              1. Sélectionnez une zone
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 2 
          }}>
            {availableZones.map(zone => (
              <Button
                key={zone}
                fullWidth
                variant={selectedZone === zone ? "contained" : "outlined"}
                onClick={() => handleZoneSelect(zone)}
                sx={{
                  p: 2,
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  textAlign: 'center',
                  ...(selectedZone === zone && {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    }
                  })
                }}
              >
                {zone}
              </Button>
            ))}
          </Box>
        </CardContent>
      </Card>

      {selectedZone && (
        <>
          {/* Predefined Tasks */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                    2. Sélectionnez les tâches
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Décochez les tâches qui ne concernent pas votre établissement
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {Object.entries(predefinedTasks[selectedZone as keyof typeof predefinedTasks]).map(([category]) => (
                  <Paper key={category} variant="outlined" sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Category sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                        {category}
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {selectedTasks
                        .filter(task => task.category === category)
                        .map((task, index) => (
                          <Box key={index} sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 2
                          }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={task.selected}
                                  onChange={() => toggleTaskSelection(
                                    selectedTasks.findIndex(t => t.name === task.name && t.category === category)
                                  )}
                                />
                              }
                              label={
                                <Typography variant="body1" sx={{ flexGrow: 1 }}>
                                  {task.name}
                                </Typography>
                              }
                              sx={{ flexGrow: 1, m: 0 }}
                            />
                            {task.selected && (
                              <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Fréquence</InputLabel>
                                <Select
                                  value={task.customFrequency}
                                  label="Fréquence"
                                  onChange={(e) => changeTaskFrequency(
                                    selectedTasks.findIndex(t => t.name === task.name && t.category === category),
                                    e.target.value
                                  )}
                                >
                                  {(frequencyOptions as FrequencyOption[]).map((opt: FrequencyOption) => (
                                    <MenuItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            )}
                          </Box>
                        ))}
                    </Box>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Custom Task */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <AddIcon />
                </Avatar>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                  3. Ajouter une tâche personnalisée
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: '2fr 1fr auto' },
                gap: 2,
                alignItems: 'center'
              }}>
                <Box>
                  <TextField
                    fullWidth
                    label="Nom de la tâche"
                    value={customTask.name}
                    onChange={(e) => setCustomTask({...customTask, name: e.target.value})}
                    placeholder="Entrez le nom de la tâche personnalisée"
                    variant="outlined"
                  />
                </Box>
                <Box>
                  <FormControl fullWidth>
                    <InputLabel>Fréquence</InputLabel>
                    <Select
                      value={customTask.frequency}
                      label="Fréquence"
                      onChange={(e) => setCustomTask({...customTask, frequency: e.target.value})}
                    >
                      {(frequencyOptions as FrequencyOption[]).map((opt: FrequencyOption) => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box>
                  <Button
                    variant="contained"
                    onClick={addCustomTask}
                    startIcon={<AddIcon />}
                    sx={{ height: '56px' }}
                  >
                    Ajouter
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Scheduling Options */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <Schedule />
                </Avatar>
                <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
                  4. Options de planification
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                gap: 3
              }}>
                <Box>
                  <TextField
                    fullWidth
                    label="Date de début"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    slotProps={{
                      inputLabel: { shrink: true }
                    }}
                    variant="outlined"
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Planifier pour combien de jours?"
                    type="number"
                    slotProps={{ htmlInput: { min: 1, max: 365 } }}
                    value={daysToSchedule}
                    onChange={(e) => setDaysToSchedule(Number(e.target.value))}
                    variant="outlined"
                    helperText="Entre 1 et 365 jours"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Submit */}
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 600 }}>
                Résumé de la planification
              </Typography>
              {selectedTasks.filter(task => task.selected).length > 0 && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {selectedTasks.filter(task => task.selected).length} tâches sélectionnées pour {daysToSchedule} jours
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 3 }}>
                    {selectedTasks.filter(task => task.selected).slice(0, 5).map((task, index) => (
                      <Chip
                        key={index}
                        label={task.name}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                    {selectedTasks.filter(task => task.selected).length > 5 && (
                      <Chip
                        label={`+${selectedTasks.filter(task => task.selected).length - 5} autres`}
                        size="small"
                        color="primary"
                      />
                    )}
                  </Box>
                </>
              )}
              <Button
                size="large"
                variant="contained"
                onClick={submitTasks}
                disabled={selectedTasks.filter(task => task.selected).length === 0}
                sx={{
                  background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                  color: 'white',
                  px: 4,
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  minHeight: '56px',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                    boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                  },
                  '&:disabled': {
                    background: '#e0e0e0',
                    color: '#9e9e9e',
                    boxShadow: 'none',
                  }
                }}
              >
                Créer le plan de nettoyage pour {daysToSchedule} jours
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default CleaningScheduler;