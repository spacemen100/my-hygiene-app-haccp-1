import React, { useState, useEffect } from 'react';
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
  Alert,
  Chip,
  Avatar,
  Paper,
  Divider,
  Grid
} from '@mui/material';
import {
  CleaningServices,
  CheckCircle,
  Schedule,
  Category,
  Add as AddIcon
} from '@mui/icons-material';

const CleaningScheduler = () => {
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [customTask, setCustomTask] = useState({
    name: '',
    frequency: 'daily',
    customDays: 1
  });
  const [daysToSchedule, setDaysToSchedule] = useState(100);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Get available zones from predefined tasks
  const availableZones = Object.keys(predefinedTasks);

  // Handle zone selection
  const handleZoneSelect = (zone) => {
    setSelectedZone(zone);
    // Initialize selected tasks for this zone (all selected by default)
    const zoneTasks = [];
    Object.entries(predefinedTasks[zone]).forEach(([category, tasks]) => {
      tasks.forEach(task => {
        zoneTasks.push({
          ...task,
          category,
          selected: true,
          customFrequency: task.defaultFrequency
        });
      });
    });
    setSelectedTasks(zoneTasks);
  };

  // Toggle task selection
  const toggleTaskSelection = (index) => {
    const updatedTasks = [...selectedTasks];
    updatedTasks[index].selected = !updatedTasks[index].selected;
    setSelectedTasks(updatedTasks);
  };

  // Change frequency for a task
  const changeTaskFrequency = (index, frequency) => {
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

      // Create all tasks and their schedules
      for (const task of tasksToSubmit) {
        // First, create the base task
        const { data: createdTask, error: taskError } = await supabase
          .from('cleaning_tasks')
          .insert([{
            name: task.name,
            frequency: task.customFrequency,
            cleaning_zone_id: selectedZone, // You might need to adjust this based on your actual zone IDs
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

      // Success feedback could be handled here with a proper notification system
    } catch (error) {
      console.error("Erreur lors de la création du plan:", error);
      alert("Une erreur est survenue: " + error.message);
    }
  };

  // Helper function to generate scheduled records
  const generateScheduledRecords = (taskId, frequency, startDate, daysToSchedule) => {
    const records = [];
    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + parseInt(daysToSchedule));
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
          <Grid container spacing={2}>
            {availableZones.map(zone => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={zone}>
                <Button
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
              </Grid>
            ))}
          </Grid>
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
                {Object.entries(predefinedTasks[selectedZone]).map(([category, _]) => (
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
                                  {frequencyOptions.map(opt => (
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
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nom de la tâche"
                    value={customTask.name}
                    onChange={(e) => setCustomTask({...customTask, name: e.target.value})}
                    placeholder="Entrez le nom de la tâche personnalisée"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Fréquence</InputLabel>
                    <Select
                      value={customTask.frequency}
                      label="Fréquence"
                      onChange={(e) => setCustomTask({...customTask, frequency: e.target.value})}
                    >
                      {frequencyOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={addCustomTask}
                    startIcon={<AddIcon />}
                    sx={{ height: '56px' }}
                  >
                    Ajouter
                  </Button>
                </Grid>
              </Grid>
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
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Date de début"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Planifier pour combien de jours?"
                    type="number"
                    inputProps={{ min: 1, max: 365 }}
                    value={daysToSchedule}
                    onChange={(e) => setDaysToSchedule(e.target.value)}
                    variant="outlined"
                    helperText="Entre 1 et 365 jours"
                  />
                </Grid>
              </Grid>
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